/**
 * @file src/core/paths.js
 * Open-spider directory and file path management.
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

export const getDataDir = () => process.env.OPEN_SPIDER_HOME || join(homedir(), '.open-spider');
export const getConfigFile = () => join(getDataDir(), 'config.json');
export const getProvidersFile = () => join(getDataDir(), 'providers.json');
export const getAgentsFile = () => join(getDataDir(), 'agents.json');
export const getMcpFile = () => join(getDataDir(), 'mcp.json');
export const getSecretsFile = () => join(getDataDir(), 'secrets.json');
export const getRunsDir = () => join(getDataDir(), 'runs');
export const getRunDir = (runId) => join(getRunsDir(), runId);
export const getPluginsDir = () => join(getDataDir(), 'plugins');
export const getCacheDir = () => join(getDataDir(), 'cache');
export const getHealthCacheFile = () => join(getCacheDir(), 'health.json');
export const getModelsCacheFile = () => join(getCacheDir(), 'models.json');

/**
 * Ensures all required Open-spider directories exist.
 */
export function ensureDataDirs() {
  const dirs = [getDataDir(), getRunsDir(), getPluginsDir(), getCacheDir()];
  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}
