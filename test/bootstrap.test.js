import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);
const ROOT_DIR = process.cwd();

test('Phase 0: Bootstrap & Project Structure', async (t) => {
  await t.test('Root files exist', () => {
    assert.ok(existsSync(join(ROOT_DIR, 'SPEC.md')), 'SPEC.md must exist');
    assert.ok(existsSync(join(ROOT_DIR, 'AGENTS.md')), 'AGENTS.md must exist');
    assert.ok(existsSync(join(ROOT_DIR, 'PROGRESS.md')), 'PROGRESS.md must exist');
    assert.ok(existsSync(join(ROOT_DIR, 'package.json')), 'package.json must exist');
    assert.ok(existsSync(join(ROOT_DIR, 'bin/open-spider.js')), 'bin/open-spider.js must exist');
  });

  await t.test('package.json has valid configuration', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'open-spider');
    assert.equal(pkg.type, 'module');
    assert.ok(pkg.bin['open-spider'], 'open-spider bin mapping exists');
    assert.ok(pkg.bin['spider'], 'spider alias bin mapping exists');
  });

  await t.test('CLI executable responds to --version', async () => {
    const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'));
    const { stdout } = await execFileAsync('node', ['bin/open-spider.js', '--version']);
    assert.equal(stdout.trim(), pkg.version);
  });

  await t.test('CLI executable responds to help command', async () => {
    const { stdout } = await execFileAsync('node', ['bin/open-spider.js', 'help']);
    assert.match(stdout, /Usage: open-spider|Usage: spider/i);
    assert.match(stdout, /run/i);
    assert.match(stdout, /doctor/i);
    assert.match(stdout, /setup/i);
    assert.match(stdout, /agents/i);
    assert.match(stdout, /providers/i);
    assert.match(stdout, /models/i);
  });
});
