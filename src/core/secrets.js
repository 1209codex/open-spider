/**
 * @file src/core/secrets.js
 * Secure storage and retrieval of API keys with 0600 file permissions.
 */

import { readFileSync, writeFileSync, existsSync, chmodSync, statSync } from 'node:fs';
import { getSecretsFile, ensureDataDirs } from './paths.js';
import { SecretError } from './errors.js';

/**
 * Loads secrets from secrets.json.
 * @returns {Record<string, any>}
 */
export function loadSecrets() {
  ensureDataDirs();
  const file = getSecretsFile();

  if (!existsSync(file)) {
    saveSecrets({ providers: {} });
    return { providers: {} };
  }

  // Ensure file permissions are 0600
  try {
    chmodSync(file, 0o600);
  } catch {
    // Ignore chmod errors on systems that do not support POSIX modes
  }

  try {
    const raw = readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new SecretError(`Failed to load secrets from ${file}: ${err.message}`);
  }
}

/**
 * Saves secrets object with strict 0600 mode.
 * @param {Record<string, any>} secrets
 */
export function saveSecrets(secrets) {
  ensureDataDirs();
  const file = getSecretsFile();

  try {
    writeFileSync(file, JSON.stringify(secrets, null, 2), { encoding: 'utf8', mode: 0o600 });
    try {
      chmodSync(file, 0o600);
    } catch {
      // Ignore chmod error if unsupported
    }
  } catch (err) {
    throw new SecretError(`Failed to save secrets to ${file}: ${err.message}`);
  }
}

/**
 * Retrieves an API key for a provider, falling back to process.env if provided.
 * @param {string} providerId
 * @param {string} [envKey]
 * @returns {string|undefined}
 */
export function getSecret(providerId, envKey) {
  const secrets = loadSecrets();
  if (secrets.providers && secrets.providers[providerId]) {
    return secrets.providers[providerId];
  }
  if (envKey && process.env[envKey]) {
    return process.env[envKey];
  }
  return undefined;
}

/**
 * Sets an API key for a provider.
 * @param {string} providerId
 * @param {string} apiKey
 */
export function setSecret(providerId, apiKey) {
  const secrets = loadSecrets();
  if (!secrets.providers) {
    secrets.providers = {};
  }
  secrets.providers[providerId] = apiKey;
  saveSecrets(secrets);
}

/**
 * Removes an API key for a provider.
 * @param {string} providerId
 */
export function removeSecret(providerId) {
  const secrets = loadSecrets();
  if (secrets.providers && secrets.providers[providerId]) {
    delete secrets.providers[providerId];
    saveSecrets(secrets);
  }
}

/**
 * Masks an API key for safe display (sk-...abcd). Never prints full key.
 * @param {string} key
 * @returns {string}
 */
export function maskSecret(key) {
  if (!key || typeof key !== 'string') return '(not set)';
  if (key.length <= 8) return '••••' + key.slice(-2);
  const prefix = key.startsWith('sk-') ? 'sk-…' : key.slice(0, 3) + '…';
  const suffix = key.slice(-4);
  return `${prefix}${suffix}`;
}

/**
 * Verifies if secrets.json has strict permissions (0600 or equivalent).
 * @returns {boolean}
 */
export function checkSecretsPermissions() {
  const file = getSecretsFile();
  if (!existsSync(file)) return true;
  try {
    const stats = statSync(file);
    const mode = stats.mode & 0o777;
    // On POSIX, 0600 is exact mode. Allow 0600 or 0400.
    return mode === 0o600 || mode === 0o400;
  } catch {
    return false;
  }
}
