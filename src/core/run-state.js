/**
 * @file src/core/run-state.js
 * Run state persistence and history tracking.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getRunsDir, getRunDir, ensureDataDirs } from './paths.js';

/**
 * Creates and initializes a new run record.
 * @param {string} goal
 * @param {object} [options={}]
 * @returns {object}
 */
export function createRun(goal, options = {}) {
  ensureDataDirs();
  const timestamp = Date.now();
  const runId = `run-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  const runDir = getRunDir(runId);

  if (!existsSync(runDir)) {
    mkdirSync(runDir, { recursive: true });
  }

  const state = {
    id: runId,
    goal,
    status: 'running',
    options,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plan: null,
    tasks: {},
    results: {},
    summary: null
  };

  saveRunState(runId, state);
  return state;
}

/**
 * Saves or updates run state.
 * @param {string} runId
 * @param {object} state
 */
export function saveRunState(runId, state) {
  const runDir = getRunDir(runId);
  if (!existsSync(runDir)) {
    mkdirSync(runDir, { recursive: true });
  }
  state.updatedAt = new Date().toISOString();
  const file = join(runDir, 'state.json');
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Reads run state by runId.
 * @param {string} runId
 * @returns {object|null}
 */
export function getRunState(runId) {
  const file = join(getRunDir(runId), 'state.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Lists recent runs sorted newest first.
 * @param {number} [limit=20]
 * @returns {object[]}
 */
export function listRuns(limit = 20) {
  ensureDataDirs();
  const runsDir = getRunsDir();
  if (!existsSync(runsDir)) return [];

  try {
    const entries = readdirSync(runsDir, { withFileTypes: true });
    const runDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    const runs = [];

    for (const dirName of runDirs) {
      const state = getRunState(dirName);
      if (state) runs.push(state);
    }

    runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return runs.slice(0, limit);
  } catch {
    return [];
  }
}
