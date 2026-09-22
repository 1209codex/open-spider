// src/agents/health.js
/**
 * Simple health store for worker adapters.
 * Persists JSON at <dataDir>/cache/health.json.
 * Structure per workerId:
 *   {
 *     status: "healthy" | "limited" | "unauthenticated" | "unavailable",
 *     cooldownUntil: number|null, // epoch ms
 *     lastError: string|null,
 *     lastChecked: number|null
 *   }
 */
import { promises as fs } from "node:fs";
import { getDataDir } from "../core/paths.js";
import { join } from "node:path";

const healthFile = () => join(getDataDir(), "cache", "health.json");

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

export async function recordSuccess(workerId) {
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
  const data = await loadHealth();
  const now = Date.now();
  let status = "unavailable";
  if (errorClass && errorClass.name === "QuotaError") status = "limited";
  else if (errorClass && errorClass.name === "AuthError") status = "unauthenticated";
  const cooldown = retryAfter ? now + retryAfter * 1000 : null;
  data[workerId] = {
    status,
    cooldownUntil: cooldown,
    lastError: errorClass ? errorClass.name : "WorkerError",
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
