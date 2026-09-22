/**
 * @file src/core/paths.js
 * Open-spider directory and file path management.
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

/**
 * Returns the base data directory for Open-spider.
 * Honors OPEN_SPIDER_HOME environment variable, defaults to ~/.open-spider
 * @returns {string}
 */
export function getDataDir() {
  return process.env.OPEN_SPIDER_HOME || join(homedir(), '.open-spider');
}

/**
 * Path to config.json
 * @returns {string}
 */
export function getConfigFile() {
  return join(getDataDir(), 'config.json');
}

/**
 * Path to providers.json
 * @returns {string}
 */
export function getProvidersFile() {
  return join(getDataDir(), 'providers.json');
}

/**
 * Path to agents.json
 * @returns {string}
 */
export function getAgentsFile() {
  return join(getDataDir(), 'agents.json');
}

/**
 * Path to mcp.json
 * @returns {string}
 */
export function getMcpFile() {
  return join(getDataDir(), 'mcp.json');
}

/**
 * Path to secrets.json
 * @returns {string}
 */
export function getSecretsFile() {
  return join(getDataDir(), 'secrets.json');
}

/**
 * Path to runs directory
 * @returns {string}
 */
export function getRunsDir() {
  return join(getDataDir(), 'runs');
}

/**
 * Path to specific run directory
 * @param {string} runId
 * @returns {string}
 */
export function getRunDir(runId) {
  return join(getRunsDir(), runId);
}

/**
 * Path to plugins directory
 * @returns {string}
 */
export function getPluginsDir() {
  return join(getDataDir(), 'plugins');
}

/**
 * Path to cache directory
 * @returns {string}
 */
export function getCacheDir() {
  return join(getDataDir(), 'cache');
}

/**
 * Path to health cache file
 * @returns {string}
 */
export function getHealthCacheFile() {
  return join(getCacheDir(), 'health.json');
}

/**
 * Path to models cache file
 * @returns {string}
 */
export function getModelsCacheFile() {
  return join(getCacheDir(), 'models.json');
}

/**
 * Ensures all required Open-spider directories exist.
 */
export function ensureDataDirs() {
  const dirs = [getDataDir(), getRunsDir(), getPluginsDir(), getCacheDir()];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }
}
