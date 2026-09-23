// test/session.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { executeSlashCommand } from '../src/manager/session.js';
import { loadConfig } from '../src/core/config.js';

describe('Manager REPL Slash Commands', () => {
  test('/help executes without error', async () => {
    const res = await executeSlashCommand('/help');
    assert.equal(res, undefined);
  });

  test('/status displays session information', async () => {
    const sessionState = { strategy: 'balanced', pinnedWorker: 'hermes' };
    const res = await executeSlashCommand('/status', sessionState);
    assert.equal(res, undefined);
  });

  test('/pin sets pinned worker and task assignments in session', async () => {
    const sessionState = {};
    await executeSlashCommand('/pin all codex', sessionState);
    assert.equal(sessionState.pinnedWorker, 'codex');

    await executeSlashCommand('/pin t1 hermes', sessionState);
    assert.match(sessionState.assignments, /t1=hermes/);
  });

  test('/exclude adds worker to exclusion list', async () => {
    const sessionState = {};
    await executeSlashCommand('/exclude antigravity', sessionState);
    assert.deepEqual(sessionState.excluded, ['antigravity']);
  });

  test('/use updates manager provider and model', async () => {
    await executeSlashCommand('/use groq llama-3.3-70b-versatile');
    const config = loadConfig();
    assert.equal(config.manager.provider, 'groq');
    assert.equal(config.manager.model, 'llama-3.3-70b-versatile');
  });

  test('/quit returns exit signal', async () => {
    const res = await executeSlashCommand('/quit');
    assert.equal(res, 'exit');
  });
});
