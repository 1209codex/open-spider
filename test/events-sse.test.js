// test/events-sse.test.js
/**
 * Test suite for real-time EventBus and Server-Sent Events (SSE) stream endpoint.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { events } from '../src/core/events.js';
import { startServer } from '../src/webapp/server.js';

let server;
let port;

describe('EventBus & Live SSE Streaming', () => {
  before(async () => {
    server = await startServer(0);
    port = server.address().port;
  });

  after(() => {
    if (server) server.close();
  });

  test('events instance emits and receives local events', (t, done) => {
    const handler = (evt) => {
      assert.equal(evt.type, 'test:custom');
      assert.equal(evt.payload.msg, 'hello');
      events.off('test:custom', handler);
      done();
    };

    events.on('test:custom', handler);
    events.emitEvent('test:custom', { payload: { msg: 'hello' } });
  });

  test('events helper methods emit properly structured payloads', (t, done) => {
    const handler = (evt) => {
      if (evt.type === 'task:output') {
        assert.equal(evt.taskId, 't1');
        assert.equal(evt.worker, 'codex');
        assert.equal(evt.text, 'compiling output...');
        events.off('*', handler);
        done();
      }
    };

    events.on('*', handler);
    events.emitTaskOutput('run-123', 't1', 'codex', 'compiling output...');
  });

  test('GET /api/events streams Server-Sent Events over HTTP', async () => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/api/events',
        method: 'GET',
        headers: { 'Accept': 'text/event-stream' }
      }, (res) => {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'text/event-stream');

        let chunks = '';
        res.on('data', (chunk) => {
          chunks += chunk.toString();
          if (chunks.includes('task:started') && chunks.includes('t99')) {
            req.destroy();
            resolve();
          }
        });

        // Emit an event to trigger SSE push
        setTimeout(() => {
          events.emitTaskState('started', { taskId: 't99', worker: 'hermes' });
        }, 50);
      });

      req.on('error', (err) => {
        // Ignored if destroyed cleanly
        if (err.code !== 'ECONNRESET') reject(err);
      });
      req.end();
    });
  });
});
