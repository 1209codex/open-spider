// src/agents/health.js
/**
 * Health store and live runtime status tracker for worker adapters.
 * Persists JSON at <dataDir>/cache/health.json and tracks active/working agents.
 */
import { promises as fs } from "node:fs";
import { getDataDir } from "../core/paths.js";
import { join } from "node:path";
import { AGENT_PROFILES } from "../data/agent-profiles.js";
import { loadConfig } from "../core/config.js";
import { getModelTier } from "../providers/model-list.js";

const healthFile = () => join(getDataDir(), "cache", "health.json");

/** @type {Map<string, { taskId: string, taskTitle: string, startedAt: number }>} */
const activeTasks = new Map();

async function loadHealth() {
  try {
    const raw = await fs.readFile(healthFile(), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveHealth(obj) {
  const dir = join(getDataDir(), "cache");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(healthFile(), JSON.stringify(obj, null, 2), { mode: 0o600 });
}

export function setWorkerWorking(workerId, task) {
  if (!workerId) return;
  activeTasks.set(workerId, {
    taskId: task?.id || "unknown",
    taskTitle: task?.title || task?.instructions || "Working...",
    startedAt: Date.now()
  });
}

export function setWorkerIdle(workerId) {
  if (!workerId) return;
  activeTasks.delete(workerId);
}

export async function recordSuccess(workerId) {
  setWorkerIdle(workerId);
  const data = await loadHealth();
  data[workerId] = {
    status: "healthy",
    cooldownUntil: null,
    lastError: null,
    lastChecked: Date.now(),
  };
  await saveHealth(data);
}

export async function recordFailure(workerId, errorClass, retryAfter = null) {
  setWorkerIdle(workerId);
  const data = await loadHealth();
  const now = Date.now();
  let status = "unavailable";
  if (errorClass && errorClass.name === "QuotaError") status = "limited";
  else if (errorClass && errorClass.name === "AuthError") status = "unauthenticated";
  const cooldown = retryAfter ? now + retryAfter * 1000 : null;
  data[workerId] = {
    status,
    cooldownUntil: cooldown,
    lastError: errorClass ? (errorClass.message || errorClass.name) : "WorkerError",
    lastChecked: now,
  };
  await saveHealth(data);
}

export async function isWorkerAvailable(workerId) {
  const data = await loadHealth();
  const rec = data[workerId];
  if (!rec) return true; // unknown = assume healthy
  if (rec.status === "healthy") return true;
  if (rec.status === "limited" && rec.cooldownUntil && rec.cooldownUntil > Date.now()) {
    return false;
  }
  if (rec.status === "unauthenticated" || rec.status === "unavailable") return false;
  return true;
}

export async function getHealthReport() {
  return await loadHealth();
}

/**
 * Returns comprehensive live status for all worker adapters.
 * @param {Record<string, { detected: boolean, version?: string }>} [detection]
 */
export async function getWorkersStatus(detection = {}) {
  const health = await loadHealth();
  let config = {};
  try {
    config = loadConfig();
  } catch {
    config = {};
  }
  const configWorkers = config.workers || {};
  const workerIds = ["codex", "opencode", "hermes", "antigravity", "custom"];

  return workerIds.map((id) => {
    const profile = AGENT_PROFILES[id] || {
      id,
      name: id.toUpperCase(),
      role: "Worker Agent",
      description: "",
      tags: [],
      defaultModel: "",
      recommendedModels: []
    };
    const healthRec = health[id] || { status: "healthy", cooldownUntil: null, lastError: null };
    const active = activeTasks.get(id);
    const workerConfig = configWorkers[id] || {};
    const enabled = workerConfig.enabled !== false;
    const model = workerConfig.model || profile.defaultModel || "";
    const modelTier = getModelTier(model);

    let liveStatus = "idle";
    if (!enabled) {
      liveStatus = "disabled";
    } else if (active) {
      liveStatus = "working";
    } else if (healthRec.status === "limited" && healthRec.cooldownUntil && healthRec.cooldownUntil > Date.now()) {
      liveStatus = "limited";
    } else if (healthRec.status === "unauthenticated") {
      liveStatus = "unauthenticated";
    } else if (healthRec.status === "unavailable") {
      liveStatus = "unavailable";
    }

    const detectInfo = detection[id] || { detected: false, version: "N/A" };

    return {
      id,
      name: profile.name,
      role: profile.role,
      description: profile.description,
      tags: profile.tags,
      status: liveStatus,
      healthStatus: healthRec.status,
      currentTask: active || null,
      model,
      modelTier,
      enabled,
      detected: detectInfo.detected,
      version: detectInfo.version,
      lastError: healthRec.lastError || null,
      recommendedModels: profile.recommendedModels
    };
  });
}
