// test/webapp.test.js

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../src/webapp/server.js';
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

  test('GET /style.css serves CSS', async () => {
    const res = await request({ path: '/style.css', method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.match(res.data, /--bg-base/);
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

  test('GET /api/health returns health status', async () => {
    const res = await request({ path: '/api/health', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.equal(json.status, 'ok');
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
