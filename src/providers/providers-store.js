/**
 * @file src/providers/providers-store.js
 * Persistent store for custom API providers and catalog aggregation.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { getProvidersFile, ensureDataDirs } from '../core/paths.js';
import { PROVIDERS_CATALOG } from '../data/providers.catalog.js';
import { setSecret, removeSecret, getSecret } from '../core/secrets.js';

/**
 * Loads custom providers from providers.json.
 * @returns {Array<object>}
 */
export function loadCustomProviders() {
  ensureDataDirs();
  const file = getProvidersFile();
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Saves custom providers to providers.json.
 * @param {Array<object>} providers
 */
export function saveCustomProviders(providers) {
  ensureDataDirs();
  const file = getProvidersFile();
  writeFileSync(file, JSON.stringify(providers, null, 2), 'utf8');
}

/**
 * Returns all providers (catalog + custom) sorted FREE first, then PAID.
 * @returns {Array<object>}
 */
export function getAllProviders() {
  const custom = loadCustomProviders();
  const merged = [...PROVIDERS_CATALOG];

  for (const c of custom) {
    if (!merged.some((p) => p.id === c.id)) {
      merged.push(c);
    }
  }

  // Strict Free Providers first, then Paid Providers
  merged.sort((a, b) => {
    if (a.free && !b.free) return -1;
    if (!a.free && b.free) return 1;
    return a.name.localeCompare(b.name);
  });

  return merged;
}

/**
 * Adds or updates a provider.
 * @param {object} provider
 * @param {string} [apiKey]
 */
export function addProvider(provider, apiKey) {
  if (apiKey) {
    setSecret(provider.id, apiKey);
  }
  const isCatalog = PROVIDERS_CATALOG.some((p) => p.id === provider.id);
  if (!isCatalog) {
    const custom = loadCustomProviders();
    const idx = custom.findIndex((p) => p.id === provider.id);
    if (idx >= 0) {
      custom[idx] = { ...custom[idx], ...provider };
    } else {
      custom.push(provider);
    }
    saveCustomProviders(custom);
  }
}

/**
 * Removes a provider.
 * @param {string} providerId
 */
export function removeProvider(providerId) {
  removeSecret(providerId);
  const custom = loadCustomProviders();
  const filtered = custom.filter((p) => p.id !== providerId);
  saveCustomProviders(filtered);
}
