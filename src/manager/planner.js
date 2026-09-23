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
import { getConfigValue } from "../core/config.js";

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
        suggested_worker: "custom",
        why: "fallback",
        acceptance: ["Task completed"],
        promptFile: tmpPath,
      },
    ],
  };
}


export async function planTask(taskDescription) {
  const providerId = getConfigValue("manager.provider") || "openrouter";
  const model = getConfigValue("manager.model") || "gpt-4o-mini";
  const client = new LLMClient({ providerId, model });
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
          write: true|false,
          suggested_worker: "string",
          why: "string",
          acceptance: ["string"]
        }
      ]
    },
    null,
    2
  )}\nTask: ${taskDescription}`;

  try {
    logger.info(`Planning task via ${providerId}/${model}`);
    const response = await client.complete({
      messages: [{ role: "system", content: prompt }],
      temperature: 0,
    });
    const plan = JSON.parse(response?.choices?.[0]?.message?.content || "{}");
    return plan;
  } catch (err) {
    logger.warn(`Planner error: ${formatError(err)}`);
    // Return fallback plan
    return fallbackPlan(taskDescription);
  }
}
