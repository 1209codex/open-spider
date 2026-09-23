// src/manager/router.js
/**
 * Router – decides which worker should handle each task.
 * Uses health status from src/agents/health.js and the manager config.
 * Returns an array of task objects with an extra `worker` property.
 */
import { getHealthReport, isWorkerAvailable } from "../agents/health.js";
import { getConfigValue } from "../core/config.js";
import { logger } from "../core/logger.js";

/**
 * Simple scoring based on the task `kind` and a static capability map.
 */
const capabilityMap = {
  frontend: ["antigravity", "hermes"],
  backend: ["codex", "opencode"],
  tests: ["codex", "opencode"],
  refactor: ["codex", "opencode"],
  debug: ["codex", "opencode"],
  research: ["hermes"],
  docs: ["hermes"],
  devops: ["opencode"],
  review: ["codex"],
  other: ["codex", "custom"],
};

export async function routeTasks(plan, strategy = "free-first") {
  const health = await getHealthReport();
  const routed = [];

  for (const task of plan.tasks) {
    let chosen = null;
    // 1️⃣ Respect any manual pin in config (e.g., manager.pin[task.id]) – not implemented yet
    // 2️⃣ Filter out unavailable workers
    const candidates = capabilityMap[task.kind] || capabilityMap.other;
    const available = candidates.filter((w) => isWorkerAvailable(w));

    if (available.length === 0) {
      // No healthy worker; fallback to any known worker
      chosen = candidates[0];
    } else if (strategy === "free-first") {
      // Prefer workers that use free models – check config provider fees (simplified)
      // Here we just pick the first available; real implementation would inspect provider models.
      chosen = available[0];
    } else if (strategy === "quality") {
      // Prefer the worker with the highest capability (hardcoded order)
      chosen = available[available.length - 1];
    } else {
      // balanced or unknown – round‑robin style
      chosen = available[Math.floor(Math.random() * available.length)];
    }

    routed.push({ ...task, worker: chosen });
    logger.info(`Task ${task.id} routed to ${chosen}`);
  }
  return routed;
}
