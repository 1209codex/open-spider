// src/manager/router.js
/**
 * Router – assigns subtasks to best-suited worker agents in the company.
 * Respects worker capabilities, health status, user assignments, and configured models.
 */
import { isWorkerAvailable } from "../agents/health.js";
import { loadConfig } from "../core/config.js";
import { logger } from "../core/logger.js";

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

export async function routeTasks(plan, strategy = "free-first", options = {}) {
  let config = {};
  try {
    config = loadConfig();
  } catch {
    config = {};
  }
  const configWorkers = config.workers || {};
  const routed = [];

  // Parse assignment overrides like t1=codex,t2=hermes
  const assignments = {};
  if (options.assign) {
    const pairs = String(options.assign).split(",");
    for (const p of pairs) {
      const [tId, wId] = p.split("=").map((s) => s.trim());
      if (tId && wId) assignments[tId] = wId;
    }
  }

  for (const task of plan.tasks) {
    let chosen = null;

    // 1. Global worker pin from options or task assignment
    if (options.worker) {
      chosen = options.worker;
    } else if (assignments[task.id]) {
      chosen = assignments[task.id];
    } else if (task.suggested_worker && configWorkers[task.suggested_worker]?.enabled !== false) {
      // Suggested worker from planner if enabled
      if (await isWorkerAvailable(task.suggested_worker)) {
        chosen = task.suggested_worker;
      }
    }

    if (!chosen) {
      // 2. Filter candidates by capability and enabled flag
      const candidates = capabilityMap[task.kind] || capabilityMap.other;
      const enabledCandidates = candidates.filter((w) => configWorkers[w]?.enabled !== false);
      const pool = enabledCandidates.length > 0 ? enabledCandidates : candidates;
      
      const available = [];
      for (const w of pool) {
        if (await isWorkerAvailable(w)) available.push(w);
      }

      if (available.length === 0) {
        chosen = pool[0] || "codex";
      } else if (strategy === "free-first") {
        chosen = available[0];
      } else if (strategy === "quality") {
        chosen = available[available.length - 1];
      } else {
        // Balanced
        chosen = available[Math.floor(Math.random() * available.length)];
      }
    }

    // Attach configured model for this worker
    const workerModel = configWorkers[chosen]?.model || task.model || undefined;

    routed.push({
      ...task,
      worker: chosen,
      model: workerModel
    });

    logger.info(`Task ${task.id} (${task.kind || 'general'}) assigned to agent [${chosen}]${workerModel ? ` using model [${workerModel}]` : ''}`);
  }

  return routed;
}
