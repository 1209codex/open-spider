/**
 * @file src/cli/doctor.js
 * Open-spider environment, storage, security, provider, and worker health diagnostics.
 */

import { execSync } from 'node:child_process';
import { existsSync, accessSync, constants } from 'node:fs';
import { getDataDir, getSecretsFile, ensureDataDirs } from '../core/paths.js';
import { checkSecretsPermissions, getSecret } from '../core/secrets.js';
import { getConfigValue } from '../core/config.js';
import { getAllProviders } from '../providers/providers-store.js';
import { CodexAdapter } from '../agents/codex.js';
import { OpencodeAdapter } from '../agents/opencode.js';
import { HermesAdapter } from '../agents/hermes.js';
import { AntigravityAdapter } from '../agents/antigravity.js';
import { CustomAdapter } from '../agents/custom.js';
import { renderTable } from '../ui/table.js';
import { theme } from '../ui/theme.js';

const adapters = {
  codex: CodexAdapter,
  opencode: OpencodeAdapter,
  hermes: HermesAdapter,
  antigravity: AntigravityAdapter,
  custom: CustomAdapter,
};

export async function runDoctor(options = {}) {
  ensureDataDirs();
  const checks = [];

  // 1. Node.js Version Check
  const nodeVer = process.version;
  const majorVer = parseInt(nodeVer.replace(/^v/, '').split('.')[0], 10);
  if (majorVer >= 20) {
    checks.push({
      status: 'OK',
      category: 'Runtime',
      name: 'Node.js Version',
      details: nodeVer,
      hint: ''
    });
  } else {
    checks.push({
      status: 'FAIL',
      category: 'Runtime',
      name: 'Node.js Version',
      details: `${nodeVer} (Requires >= 20)`,
      hint: 'Upgrade Node.js to version 20 or higher.'
    });
  }

  // 2. Platform / Termux Check
  const isTermux = !!(process.env.PREFIX && process.env.PREFIX.includes('com.termux'));
  const platform = isTermux ? 'Android (Termux)' : `${process.platform} (${process.arch})`;
  checks.push({
    status: 'OK',
    category: 'Environment',
    name: 'Platform',
    details: platform,
    hint: ''
  });

  // 3. Git Availability
  try {
    const gitVer = execSync('git --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    checks.push({
      status: 'OK',
      category: 'Tools',
      name: 'Git',
      details: gitVer,
      hint: ''
    });
  } catch {
    checks.push({
      status: 'FAIL',
      category: 'Tools',
      name: 'Git',
      details: 'Not found in PATH',
      hint: 'Install git (e.g. pkg install git or apt install git).'
    });
  }

  // 4. Data Directory Check
  const dataDir = getDataDir();
  try {
    accessSync(dataDir, constants.R_OK | constants.W_OK);
    checks.push({
      status: 'OK',
      category: 'Storage',
      name: 'Data Directory',
      details: dataDir,
      hint: ''
    });
  } catch (err) {
    checks.push({
      status: 'FAIL',
      category: 'Storage',
      name: 'Data Directory',
      details: `Inaccessible (${err.message})`,
      hint: `Ensure directory ${dataDir} has write permissions.`
    });
  }

  // 5. Secrets File Permissions
  const secretsFile = getSecretsFile();
  if (existsSync(secretsFile)) {
    const hasStrictPerms = checkSecretsPermissions();
    if (hasStrictPerms) {
      checks.push({
        status: 'OK',
        category: 'Security',
        name: 'Secrets Permissions',
        details: '0600 (Strict)',
        hint: ''
      });
    } else {
      checks.push({
        status: 'WARN',
        category: 'Security',
        name: 'Secrets Permissions',
        details: 'Not 0600 mode',
        hint: `Run: chmod 600 ${secretsFile}`
      });
    }
  } else {
    checks.push({
      status: 'OK',
      category: 'Security',
      name: 'Secrets File',
      details: 'Will be created with 0600 on save',
      hint: ''
    });
  }

  // 6. Manager LLM Provider & Key Check
  const mgrProviderId = getConfigValue('manager.provider') || 'openrouter';
  const mgrModel = getConfigValue('manager.model') || 'google/gemini-2.5-flash';
  const providers = getAllProviders();
  const providerDef = providers.find((p) => p.id === mgrProviderId);

  if (providerDef) {
    const key = getSecret(mgrProviderId, providerDef.envKey);
    if (key || mgrProviderId === 'ollama') {
      checks.push({
        status: 'OK',
        category: 'Manager LLM',
        name: `${mgrProviderId} (${mgrModel})`,
        details: key ? 'API key configured' : 'Local endpoint',
        hint: ''
      });
    } else {
      checks.push({
        status: 'WARN',
        category: 'Manager LLM',
        name: `${mgrProviderId} (${mgrModel})`,
        details: 'No API key set',
        hint: `Run: open-spider providers add (or set ${providerDef.envKey || 'API key'})`
      });
    }
  }

  // 7. Worker Adapters Detection & Deep Probing
  for (const [id, Adapter] of Object.entries(adapters)) {
    try {
      const detected = await Adapter.detect();
      const version = detected ? await Adapter.version() : 'Not detected';
      checks.push({
        status: detected ? 'OK' : 'WARN',
        category: 'Workers',
        name: id,
        details: detected ? `Detected (${version})` : 'CLI binary not in PATH',
        hint: detected ? '' : `Install or connect ${id} CLI`
      });
    } catch (err) {
      checks.push({
        status: 'WARN',
        category: 'Workers',
        name: id,
        details: `Detection error: ${err.message}`,
        hint: `Verify installation of ${id}`
      });
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ checks, timestamp: new Date().toISOString() }, null, 2));
    const hasFail = checks.some((c) => c.status === 'FAIL');
    if (hasFail) process.exitCode = 1;
    return;
  }

  console.log(theme.matrix('\n=== OPEN-SPIDER DOCTOR REPORT ===\n'));

  const headers = ['Status', 'Category', 'Component', 'Details', 'Fix / Hint'];
  const rows = checks.map((c) => {
    let statusFormatted = theme.okPrefix;
    if (c.status === 'WARN') statusFormatted = theme.warnPrefix;
    if (c.status === 'FAIL') statusFormatted = theme.failPrefix;

    return [
      statusFormatted,
      c.category,
      c.name,
      c.details,
      c.hint ? theme.warnText(c.hint) : theme.dim('✓')
    ];
  });

  console.log(renderTable(headers, rows));
  console.log('');

  const hasFail = checks.some((c) => c.status === 'FAIL');
  if (hasFail) {
    console.error(theme.failPrefix + ' One or more critical checks failed. Please review hints above.\n');
    process.exitCode = 1;
  } else {
    console.log(theme.okPrefix + ' System environment is healthy and ready for Open-spider.\n');
  }
}
