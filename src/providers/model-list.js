/**
 * @file src/providers/model-list.js
 * Model discovery, 24-hour file caching, and Free-First classification.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { getModelsCacheFile, ensureDataDirs } from '../core/paths.js';
import { PROVIDERS_CATALOG, findProvider } from '../data/providers.catalog.js';
import { getSecret } from '../core/secrets.js';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Loads cache from disk.
 * @returns {Record<string, { timestamp: number, models: Array<{id: string, name: string, free: boolean}> }>}
 */
function loadCache() {
  ensureDataDirs();
  const file = getModelsCacheFile();
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Saves cache to disk.
 * @param {object} cache
 */
function saveCache(cache) {
  ensureDataDirs();
  const file = getModelsCacheFile();
  try {
    writeFileSync(file, JSON.stringify(cache, null, 2), 'utf8');
  } catch {
    // Ignore cache write failures
  }
}

/**
 * Classifies whether a model is free based on ID or provider metadata.
 * @param {string} modelId
 * @param {object} [rawModel={}]
 * @param {object} [providerDef]
 * @returns {boolean}
 */
export function isModelFree(modelId, rawModel = {}, providerDef = null) {
  if (modelId.endsWith(':free')) return true;
  if (rawModel.pricing && (rawModel.pricing.prompt === 0 || rawModel.pricing.prompt === '0')) return true;
  if (providerDef && providerDef.curatedModels) {
    const found = providerDef.curatedModels.find((m) => m.id === modelId);
    if (found && found.free !== undefined) return found.free;
  }
  if (providerDef && providerDef.id === 'ollama') return true;
  return false;
}

/**
 * Lists models for a given provider, with 24h cache and Free-First ordering.
 * @param {string} providerId
 * @param {object} [opts]
 * @param {boolean} [opts.refresh=false]
 * @param {Array} [opts.customProviders=[]]
 * @returns {Promise<{ models: Array<{id: string, name: string, free: boolean}>, source: 'live'|'cache'|'curated' }>}
 */
export async function listModelsForProvider(providerId, opts = {}) {
  const provider = findProvider(providerId, opts.customProviders);
  if (!provider) {
    return { models: [], source: 'curated' };
  }

  const cache = loadCache();
  const now = Date.now();

  if (!opts.refresh && cache[providerId] && (now - cache[providerId].timestamp < CACHE_TTL_MS)) {
    return { models: cache[providerId].models, source: 'cache' };
  }

  const apiKey = getSecret(providerId, provider.envKey);
  const modelsUrl = `${provider.baseUrl.replace(/\/+$/, '')}${provider.modelsPath || '/models'}`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

      const models = rawList.map((m) => {
        const id = typeof m === 'string' ? m : m.id;
        const name = m.name || id;
        const free = isModelFree(id, m, provider);
        return { id, name, free };
      });

      // Strict Free First ordering
      models.sort((a, b) => {
        if (a.free && !b.free) return -1;
        if (!a.free && b.free) return 1;
        return a.id.localeCompare(b.id);
      });

      cache[providerId] = { timestamp: now, models };
      saveCache(cache);
      return { models, source: 'live' };
    }
  } catch {
    // Fall back to curated list
  }

  const curated = (provider.curatedModels || []).map((m) => ({ ...m }));
  curated.sort((a, b) => {
    if (a.free && !b.free) return -1;
    if (!a.free && b.free) return 1;
    return a.id.localeCompare(b.id);
  });

  return { models: curated, source: 'curated' };
}
