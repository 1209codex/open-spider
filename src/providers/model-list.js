// src/providers/model-list.js
/**
 * Model discovery, 24-hour file caching, and Free-First classification.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { getModelsCacheFile, ensureDataDirs } from '../core/paths.js';
import { PROVIDERS_CATALOG, findProvider } from '../data/providers.catalog.js';
import { AGENT_PROFILES } from '../data/agent-profiles.js';
import { getSecret } from '../core/secrets.js';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

function saveCache(cache) {
  ensureDataDirs();
  const file = getModelsCacheFile();
  try {
    writeFileSync(file, JSON.stringify(cache, null, 2), 'utf8');
  } catch {
    // Ignore cache write failures
  }
}

export function isModelFree(modelId, rawModel = {}, providerDef = null) {
  if (!modelId) return false;
  if (modelId.endsWith(':free')) return true;
  if (rawModel.pricing && (rawModel.pricing.prompt === 0 || rawModel.pricing.prompt === '0')) return true;
  if (providerDef && providerDef.curatedModels) {
    const found = providerDef.curatedModels.find((m) => m.id === modelId);
    if (found && found.free !== undefined) return found.free;
  }
  if (providerDef && providerDef.id === 'ollama') return true;
  return false;
}

export function getModelTier(modelId) {
  if (!modelId) return 'DEFAULT';
  if (isModelFree(modelId)) return 'FREE';
  for (const prov of PROVIDERS_CATALOG) {
    if (prov.curatedModels) {
      const found = prov.curatedModels.find((m) => m.id === modelId);
      if (found) return found.free ? 'FREE' : 'PAID';
    }
  }
  for (const agent of Object.values(AGENT_PROFILES)) {
    const found = agent.recommendedModels?.find((m) => m.id === modelId);
    if (found) return found.free ? 'FREE' : 'PAID';
  }
  return 'PAID';
}

export function getAllCuratedModels() {
  const modelMap = new Map();

  // 1. Gather from Providers Catalog
  for (const prov of PROVIDERS_CATALOG) {
    if (prov.curatedModels) {
      for (const m of prov.curatedModels) {
        modelMap.set(m.id, {
          id: m.id,
          name: m.name || m.id,
          provider: prov.id,
          providerName: prov.name,
          free: Boolean(m.free),
          tier: m.free ? 'FREE' : 'PAID'
        });
      }
    }
  }

  // 2. Gather from Agent Profiles
  for (const profile of Object.values(AGENT_PROFILES)) {
    if (profile.recommendedModels) {
      for (const m of profile.recommendedModels) {
        if (!modelMap.has(m.id)) {
          modelMap.set(m.id, {
            id: m.id,
            name: m.name || m.id,
            provider: m.provider || 'unknown',
            providerName: m.provider || 'AI Provider',
            free: Boolean(m.free),
            tier: m.free ? 'FREE' : 'PAID'
          });
        }
      }
    }
  }

  const allModels = Array.from(modelMap.values());

  // Strict Free First sorting
  allModels.sort((a, b) => {
    if (a.free && !b.free) return -1;
    if (!a.free && b.free) return 1;
    return a.id.localeCompare(b.id);
  });

  return allModels;
}

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
        return { id, name, free, tier: free ? 'FREE' : 'PAID' };
      });

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

  const curated = (provider.curatedModels || []).map((m) => ({
    ...m,
    tier: m.free ? 'FREE' : 'PAID'
  }));
  curated.sort((a, b) => {
    if (a.free && !b.free) return -1;
    if (!a.free && b.free) return 1;
    return a.id.localeCompare(b.id);
  });

  return { models: curated, source: 'curated' };
}
