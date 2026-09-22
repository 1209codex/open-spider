import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getDataDir, getConfigFile, getSecretsFile, ensureDataDirs } from '../src/core/paths.js';
import { loadConfig, saveConfig, getConfigValue, setConfigValue } from '../src/core/config.js';
import { loadSecrets, saveSecrets, getSecret, setSecret, maskSecret, checkSecretsPermissions } from '../src/core/secrets.js';
import { OpenSpiderError, ConfigError, formatError } from '../src/core/errors.js';
import { renderBanner } from '../src/ui/banner.js';
import { renderBox } from '../src/ui/box.js';
import { renderTable } from '../src/ui/table.js';
import { stripAnsi } from '../src/ui/theme.js';

const execFileAsync = promisify(execFile);

test('Phase 1: Core Foundation & UI Kit', async (t) => {
  const tempHome = mkdtempSync(join(tmpdir(), 'spider-test-'));
  const origHome = process.env.OPEN_SPIDER_HOME;
  process.env.OPEN_SPIDER_HOME = tempHome;

  t.after(() => {
    if (origHome) {
      process.env.OPEN_SPIDER_HOME = origHome;
    } else {
      delete process.env.OPEN_SPIDER_HOME;
    }
    rmSync(tempHome, { recursive: true, force: true });
  });

  await t.test('paths & directory creation', () => {
    assert.equal(getDataDir(), tempHome);
    ensureDataDirs();
    assert.ok(existsSync(join(tempHome, 'runs')));
    assert.ok(existsSync(join(tempHome, 'plugins')));
    assert.ok(existsSync(join(tempHome, 'cache')));
  });

  await t.test('config store round-trip and nested access', () => {
    const config = loadConfig();
    assert.equal(config.routing.strategy, 'free-first');
    assert.equal(getConfigValue('routing.strategy'), 'free-first');

    setConfigValue('routing.strategy', 'quality');
    assert.equal(getConfigValue('routing.strategy'), 'quality');

    setConfigValue('manager.model', 'deepseek/deepseek-chat');
    assert.equal(getConfigValue('manager.model'), 'deepseek/deepseek-chat');
  });

  await t.test('secrets store with 0600 mode and masking', () => {
    setSecret('openrouter', 'sk-or-v1-abcdef1234567890');
    const key = getSecret('openrouter');
    assert.equal(key, 'sk-or-v1-abcdef1234567890');

    // Env fallback
    process.env.TEST_API_KEY = 'test-env-val';
    assert.equal(getSecret('nonexistent', 'TEST_API_KEY'), 'test-env-val');

    // Secret masking
    const masked = maskSecret('sk-or-v1-abcdef1234567890');
    assert.equal(masked, 'sk-…7890');
    assert.ok(!masked.includes('abcdef123456'));

    // Check permissions
    const secFile = getSecretsFile();
    const stats = statSync(secFile);
    const mode = stats.mode & 0o777;
    assert.equal(mode, 0o600);
    assert.ok(checkSecretsPermissions());
  });

  await t.test('error formatting and hints without stack traces', () => {
    const err = new ConfigError('Invalid config key');
    const formatted = formatError(err, false);
    assert.ok(formatted.includes('Invalid config key'));
    assert.ok(formatted.includes('hint:'));
    assert.ok(!formatted.includes('at async TestContext'));

    const debugFormatted = formatError(err, true);
    assert.ok(debugFormatted.includes('Stack trace:'));
  });

  await t.test('UI banner adapts cleanly to wide and narrow screens', () => {
    const wideBanner = renderBanner({ version: '0.1.0', manager: 'test-model' });
    assert.ok(stripAnsi(wideBanner).includes('OPEN-SPIDER'));

    // Test box rendering
    const box = renderBox('Test box content inside', { title: 'Status' });
    assert.ok(stripAnsi(box).includes('Status'));
    assert.ok(stripAnsi(box).includes('Test box content'));

    // Test table rendering
    const table = renderTable(['Name', 'Status'], [['codex', 'ready'], ['opencode', 'ready']]);
    assert.ok(stripAnsi(table).includes('codex'));
    assert.ok(stripAnsi(table).includes('opencode'));
  });

  await t.test('CLI doctor command execution', async () => {
    const { stdout } = await execFileAsync('node', ['bin/open-spider.js', 'doctor'], {
      env: { ...process.env, OPEN_SPIDER_HOME: tempHome }
    });
    assert.ok(stdout.includes('OPEN-SPIDER DOCTOR REPORT'));
    assert.ok(stdout.includes('Node.js Version'));
    assert.ok(stdout.includes('Platform'));
    assert.ok(stdout.includes('Git'));
  });

  await t.test('CLI doctor --json output format', async () => {
    const { stdout } = await execFileAsync('node', ['bin/open-spider.js', 'doctor', '--json'], {
      env: { ...process.env, OPEN_SPIDER_HOME: tempHome }
    });
    const parsed = JSON.parse(stdout);
    assert.ok(Array.isArray(parsed.checks));
    assert.ok(parsed.checks.some((c) => c.name === 'Node.js Version'));
  });
});
