// test/webapp.test.js

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../src/webapp/server.js';
import { loadConfig, saveConfig } from '../src/core/config.js';
import http from 'node:http';

let server;
let port;

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
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
    if (postData) req.write(postData);
    req.end();
  });
}

describe('Web UI & API Server', () => {
  before(async () => {
    server = await startServer(0); // 0 => random free port
    port = server.address().port;
  });

  after(() => {
    if (server) server.close();
  });

  test('GET / serves index.html UI', async () => {
    const res = await request({ path: '/', method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.match(res.data, /Open-Spider/);
    assert.match(res.data, /Task Orchestration/);
  });

  test('GET /logo.svg serves vector logo', async () => {
    const res = await request({ path: '/logo.svg', method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.match(res.data, /<svg/);
  });

  test('GET /style.css serves CSS', async () => {
    const res = await request({ path: '/style.css', method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.match(res.data, /--bg-base/);
  });

  test('GET /api/workers returns employee agents and live status', async () => {
    const res = await request({ path: '/api/workers', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(Array.isArray(json.workers));
    assert.ok(json.workers.length >= 4);
    const codex = json.workers.find(w => w.id === 'codex');
    assert.ok(codex);
    assert.ok(codex.name);
    assert.ok(codex.role);
    assert.ok(codex.status);
  });

  test('GET /api/settings and POST /api/settings config round-trip', async () => {
    const getRes = await request({ path: '/api/settings', method: 'GET' });
    assert.equal(getRes.statusCode, 200);
    const getJson = JSON.parse(getRes.data);
    assert.ok(getJson.config);
    assert.ok(getJson.signature);
    assert.equal(getJson.signature.name, 'Open-Spider');

    const updatePayload = JSON.stringify({
      routing: { concurrency: 3 },
      workers: {
        codex: { model: 'gpt-4o-mini', enabled: true },
        hermes: { model: 'meta-llama/llama-3.3-70b-instruct', enabled: true }
      }
    });

    const postRes = await request({
      path: '/api/settings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, updatePayload);

    assert.equal(postRes.statusCode, 200);
    const postJson = JSON.parse(postRes.data);
    assert.equal(postJson.ok, true);
    assert.equal(postJson.config.routing.concurrency, 3);
    assert.equal(postJson.config.workers.codex.model, 'gpt-4o-mini');

    // Verify persistence
    const loaded = loadConfig();
    assert.equal(loaded.routing.concurrency, 3);
    assert.equal(loaded.workers.codex.model, 'gpt-4o-mini');
  });

  test('GET /api/mcp returns configured servers array', async () => {
    const res = await request({ path: '/api/mcp', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(Array.isArray(json.servers));
  });

  test('GET /api/plugins returns installed plugins array', async () => {
    const res = await request({ path: '/api/plugins', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(Array.isArray(json.plugins));
  });

  test('GET /api/health returns health and worker diagnostics', async () => {
    const res = await request({ path: '/api/health', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.equal(json.status, 'ok');
    assert.ok(json.workerHealth);
    assert.ok(json.workers);
  });

  test('POST /api/run validates task input and runs task (dry-run)', async () => {
    const postData = JSON.stringify({
      task: 'Create a small test note',
      options: { dryRun: true }
    });
    const res = await request({
      path: '/api/run',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, postData);

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.equal(json.status, 'completed');
    assert.ok(json.runId);
    assert.ok(json.plan);
  });
});
