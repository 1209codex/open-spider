/**
 * @file src/core/config.js
 * Open-spider configuration manager.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getConfigFile, ensureDataDirs } from './paths.js';
import { ConfigError } from './errors.js';

export const DEFAULT_CONFIG = {
  version: 1,
  manager: {
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash',
    fallbacks: []
  },
  routing: {
    strategy: 'free-first',
    concurrency: 2,
    failover: 'auto',
    max_retries_per_task: 3
  },
  ui: {
    theme: 'matrix',
    animation: true
  },
  workers: {}
};

/**
 * Loads configuration, creating defaults if missing.
 * @returns {typeof DEFAULT_CONFIG}
 */
export function loadConfig() {
  ensureDataDirs();
  const file = getConfigFile();

  if (!existsSync(file)) {
    saveConfig(DEFAULT_CONFIG);
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  try {
    const raw = readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed, manager: { ...DEFAULT_CONFIG.manager, ...(parsed.manager || {}) }, routing: { ...DEFAULT_CONFIG.routing, ...(parsed.routing || {}) }, ui: { ...DEFAULT_CONFIG.ui, ...(parsed.ui || {}) } };
  } catch (err) {
    throw new ConfigError(`Failed to parse config file at ${file}: ${err.message}`);
  }
}

/**
 * Saves full configuration object to disk.
 * @param {object} config
 */
export function saveConfig(config) {
  ensureDataDirs();
  const file = getConfigFile();
  const dir = dirname(file);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  try {
    writeFileSync(file, JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    throw new ConfigError(`Failed to write config file at ${file}: ${err.message}`);
  }
}

/**
 * Retrieves a nested key value (e.g. "manager.model")
 * @param {string} keyPath
 * @returns {any}
 */
export function getConfigValue(keyPath) {
  const config = loadConfig();
  if (!keyPath) return config;
  const parts = keyPath.split('.');
  let curr = config;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

/**
 * Sets a nested key value (e.g. "routing.strategy", "quality")
 * @param {string} keyPath
 * @param {any} value
 */
export function setConfigValue(keyPath, value) {
  const config = loadConfig();
  const parts = keyPath.split('.');
  let curr = config;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (curr[part] === undefined || typeof curr[part] !== 'object') {
      curr[part] = {};
    }
    curr = curr[part];
  }
  curr[parts[parts.length - 1]] = value;
  saveConfig(config);
  return config;
}
