// src/manager/planner.js
/**
 * Planner – creates a JSON plan for a high‑level task.
 * Uses the LLM client (OpenAI‑compatible) to generate a plan that conforms to the schema:
 * {
 *   summary: string,
 *   tasks: [{ id, title, instructions, kind, depends_on, write, suggested_worker, why, acceptance }]
 * }
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync } from 'node:fs';
import { logger } from "../core/logger.js";
import { formatError } from "../core/errors.js";
import { LLMClient } from "../providers/llm-client.js";
import { getConfigValue } from "../core/config.js";
import { getAllProviders } from "../providers/providers-store.js";
import { getSecret } from "../core/secrets.js";
import { buildSkillsGuidanceContext } from "../skills/skills-manager.js";

// Simple fallback plan when LLM is unavailable or fails.
function fallbackPlan(taskDescription) {
  const tmpPath = join(tmpdir(), `open-spider-${Date.now()}-${Math.random().toString(36).substring(2)}.txt`);
  writeFileSync(tmpPath, taskDescription);
  return {
    summary: `Fallback plan for ${taskDescription}`,
    tasks: [
      {
        id: "t1",
        title: taskDescription,
        instructions: taskDescription,
        kind: "other",
        depends_on: [],
        write: false,
        suggested_worker: "codex",
        why: "fallback",
        acceptance: ["Task completed"],
        promptFile: tmpPath,
      },
    ],
  };
}

export async function planTask(taskDescription) {
  const providerId = getConfigValue("manager.provider") || "openrouter";
  const model = getConfigValue("manager.model") || "google/gemini-2.5-flash";

  const providers = getAllProviders();
  const providerDef = providers.find((p) => p.id === providerId) || {
    id: providerId,
    baseUrl: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY'
  };

  const apiKey = getSecret(providerDef.id, providerDef.envKey);
  const client = new LLMClient({
    baseUrl: providerDef.baseUrl,
    apiKey
  });

  const skillsContext = buildSkillsGuidanceContext(taskDescription);
  const prompt = `You are an AI planning assistant. Produce a JSON plan for the following task. Follow this schema exactly:
${JSON.stringify(
    {
      summary: "string",
      tasks: [
        {
          id: "string",
          title: "string",
          instructions: "string",
          kind: "frontend|backend|tests|refactor|debug|research|docs|devops|review|other",
          depends_on: ["string"],
          write: true,
          suggested_worker: "string",
          why: "string",
          acceptance: ["string"]
        }
      ]
    },
    null,
    2
  )}
${skillsContext}
Task: ${taskDescription}`;

  try {
    logger.info(`Planning task via ${providerId}/${model}`);
    const response = await client.complete({
      model,
      messages: [{ role: "system", content: prompt }],
      temperature: 0,
      json: true
    });
    const content = response?.content || "{}";
    const plan = JSON.parse(content);
    if (!plan.tasks || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      throw new Error("Invalid plan generated: missing tasks array");
    }
    // Ensure promptFile is set for each task
    for (const t of plan.tasks) {
      if (!t.promptFile) {
        const tmpPath = join(tmpdir(), `open-spider-${Date.now()}-${t.id || 't'}.txt`);
        writeFileSync(tmpPath, t.instructions || t.title || taskDescription);
        t.promptFile = tmpPath;
      }
    }
    return plan;
  } catch (err) {
    logger.warn(`Planner error: ${formatError(err)}`);
    return fallbackPlan(taskDescription);
  }
}
