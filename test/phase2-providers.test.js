import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { PROVIDERS_CATALOG } from '../src/data/providers.catalog.js';
import { LLMClient } from '../src/providers/llm-client.js';
import { listModelsForProvider, isModelFree } from '../src/providers/model-list.js';
import { getAllProviders, addProvider, removeProvider } from '../src/providers/providers-store.js';
import { setSecret, getSecret, maskSecret } from '../src/core/secrets.js';
import { setConfigValue, getConfigValue } from '../src/core/config.js';
import { AuthError, QuotaError } from '../src/core/errors.js';
import { createFakeProviderServer } from './fixtures/fake-provider.mjs';

const execFileAsync = promisify(execFile);

test('Phase 2: Providers & Models Engine', async (t) => {
  const tempHome = mkdtempSync(join(tmpdir(), 'spider-p2-'));
  const origHome = process.env.OPEN_SPIDER_HOME;
  process.env.OPEN_SPIDER_HOME = tempHome;

  let fakeServer;
  let fakeUrl;

  t.before(async () => {
    fakeServer = createFakeProviderServer();
    const info = await fakeServer.start();
    fakeUrl = info.url;
  });

  t.after(async () => {
    if (fakeServer) await fakeServer.stop();
    if (origHome) {
      process.env.OPEN_SPIDER_HOME = origHome;
    } else {
      delete process.env.OPEN_SPIDER_HOME;
    }
    rmSync(tempHome, { recursive: true, force: true });
  });

  await t.test('Catalog follows strict Free-First ordering', () => {
    let seenPaid = false;
    for (const p of PROVIDERS_CATALOG) {
      if (!p.free) {
        seenPaid = true;
      } else {
        assert.equal(seenPaid, false, `Free provider ${p.id} found after a paid provider`);
      }

      if (p.curatedModels) {
        let seenPaidModel = false;
        for (const m of p.curatedModels) {
          if (!m.free) {
            seenPaidModel = true;
          } else {
            assert.equal(seenPaidModel, false, `Free model ${m.id} found after a paid model in ${p.id}`);
          }
        }
      }
    }
  });

  await t.test('LLMClient successful completion and JSON mode', async () => {
    const client = new LLMClient({ baseUrl: fakeUrl, apiKey: 'test-key' });
    const res = await client.complete({
      model: 'fake-model',
      messages: [{ role: 'user', content: 'hello' }],
      json: true
    });
    assert.equal(res.content, 'Mock LLM Response');
    assert.ok(res.raw);
  });

  await t.test('LLMClient retries on rate limit (429) with backoff', async () => {
    fakeServer.setRateLimitCount(1); // will fail once with 429 then succeed
    const client = new LLMClient({ baseUrl: fakeUrl, apiKey: 'test-key', maxRetries: 2 });
    const res = await client.complete({
      model: 'fake-model',
      messages: [{ role: 'user', content: 'test-rate-limit' }]
    });
    assert.equal(res.content, 'Mock LLM Response');
  });

  await t.test('LLMClient throws QuotaError on persistent 429', async () => {
    fakeServer.setRateLimitCount(10); // will exhaust retries
    const client = new LLMClient({ baseUrl: fakeUrl, apiKey: 'test-key', maxRetries: 1 });
    await assert.rejects(
      () => client.complete({
        model: 'fake-model',
        messages: [{ role: 'user', content: 'fail-rate-limit' }]
      }),
      (err) => err instanceof QuotaError
    );
    fakeServer.setRateLimitCount(0);
  });

  await t.test('LLMClient throws AuthError on 401', async () => {
    fakeServer.setAuthError(true);
    const client = new LLMClient({ baseUrl: fakeUrl, apiKey: 'bad-key', maxRetries: 0 });
    await assert.rejects(
      () => client.complete({
        model: 'fake-model',
        messages: [{ role: 'user', content: 'auth-fail' }]
      }),
      (err) => err instanceof AuthError
    );
    fakeServer.setAuthError(false);
  });

  await t.test('Model list discovery and caching', async () => {
    const customProvider = {
      id: 'test-fake-provider',
      name: 'Test Fake Provider',
      baseUrl: fakeUrl,
      type: 'openai-compatible',
      free: true,
      modelsPath: '/models'
    };
    addProvider(customProvider, 'valid-key');

    const result = await listModelsForProvider('test-fake-provider', {
      refresh: true,
      customProviders: [customProvider]
    });
    assert.equal(result.source, 'live');
    assert.equal(result.models.length, 2);
    assert.equal(result.models[0].free, true); // Free model first
    assert.equal(result.models[1].free, false);

    // Second call should return cached
    const cachedResult = await listModelsForProvider('test-fake-provider', {
      customProviders: [customProvider]
    });
    assert.equal(cachedResult.source, 'cache');
    assert.equal(cachedResult.models.length, 2);
  });

  await t.test('CLI providers list & models output format', async () => {
    const { stdout: listOut } = await execFileAsync('node', ['bin/open-spider.js', 'providers', 'list'], {
      env: { ...process.env, OPEN_SPIDER_HOME: tempHome }
    });
    assert.ok(listOut.includes('FREE TIER PROVIDERS'));
    assert.ok(listOut.includes('PAID TIER PROVIDERS'));
    assert.ok(listOut.indexOf('FREE TIER PROVIDERS') < listOut.indexOf('PAID TIER PROVIDERS'));

    const { stdout: modelsOut } = await execFileAsync('node', ['bin/open-spider.js', 'models', '--provider', 'openrouter'], {
      env: { ...process.env, OPEN_SPIDER_HOME: tempHome }
    });
    assert.ok(modelsOut.includes('Provider: OpenRouter'));
    assert.ok(modelsOut.includes('FREE'));
  });

  await t.test('CLI providers use sets manager provider and model', async () => {
    await execFileAsync('node', ['bin/open-spider.js', 'providers', 'use', 'groq', 'llama-3.3-70b-versatile'], {
      env: { ...process.env, OPEN_SPIDER_HOME: tempHome }
    });
    assert.equal(getConfigValue('manager.provider'), 'groq');
    assert.equal(getConfigValue('manager.model'), 'llama-3.3-70b-versatile');
  });
});
