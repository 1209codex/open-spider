// src/manager/planner.js
/**
 * Planner – creates a JSON plan for a high‑level task.
 * Uses the LLM client (OpenAI‑compatible) to generate a plan that conforms to the schema:
 * {
 *   summary: string,
 *   tasks: [{ id, title, instructions, kind, depends_on, write, suggested_worker, why, acceptance }]
 * }
 */
import { LLMClient } from "../providers/llm-client.js";
import { logger } from "../core/logger.js";
import { formatError } from "../core/errors.js";
import { getConfigValue } from "../core/config.js";

// Simple fallback plan when LLM is unavailable or fails.
function fallbackPlan(taskDescription) {
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
