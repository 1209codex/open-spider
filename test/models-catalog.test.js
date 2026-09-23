// test/models-catalog.test.js

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getAllCuratedModels, getModelTier, isModelFree } from '../src/providers/model-list.js';
import { getWorkersStatus } from '../src/agents/health.js';
import { startServer } from '../src/webapp/server.js';
import http from 'node:http';

let server;
let port;

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

describe('Model Catalog & Free/Paid Classification', () => {
  before(async () => {
    server = await startServer(0);
    port = server.address().port;
  });

  after(() => {
    if (server) server.close();
  });

  test('getAllCuratedModels returns catalog sorted strictly FREE first', () => {
    const models = getAllCuratedModels();
    assert.ok(models.length >= 10);

    let seenPaid = false;
    for (const m of models) {
      assert.ok(m.id);
      assert.ok(m.name);
      assert.ok(m.tier === 'FREE' || m.tier === 'PAID');
      if (m.tier === 'PAID') {
        seenPaid = true;
      } else if (seenPaid && m.tier === 'FREE') {
        assert.fail(`Found FREE model ${m.id} after PAID model in list`);
      }
    }
  });

  test('getModelTier identifies free and paid models accurately', () => {
    assert.equal(getModelTier('meta-llama/llama-3.3-70b-instruct:free'), 'FREE');
    assert.equal(getModelTier('google/gemini-2.0-flash-exp:free'), 'FREE');
    assert.equal(getModelTier('gpt-4o'), 'PAID');
    assert.equal(getModelTier('anthropic/claude-3.7-sonnet'), 'PAID');
  });

  test('getWorkersStatus includes modelTier for all workers', async () => {
    const workers = await getWorkersStatus();
    assert.ok(workers.length >= 4);
    for (const w of workers) {
      assert.ok(w.modelTier);
      assert.ok(['FREE', 'PAID', 'DEFAULT'].includes(w.modelTier));
    }
  });

  test('GET /api/models returns categorized free and paid lists', async () => {
    const res = await request({ path: '/api/models', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(json.models);
    assert.ok(json.categorized.free.length > 0);
    assert.ok(json.categorized.paid.length > 0);
    assert.equal(json.freeCount, json.categorized.free.length);
    assert.equal(json.paidCount, json.categorized.paid.length);
  });
});
