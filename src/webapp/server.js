// src/webapp/server.js
/**
 * Web server for Open‑spider UI and local REST API.
 * Uses only Node core modules (http, fs, path).
 * Exposes endpoints:
 *   POST /api/run      – execute a task (async or await), returns run object
 *   GET  /api/runs     – list past execution runs
 *   GET  /api/runs/:id – get details of a specific run
 *   GET  /api/logs/:id – stream run.log file for a run
 *   GET  /api/workers  – list company employee agents, live status, models
 *   GET  /api/settings – retrieve manager, routing & worker settings
 *   POST /api/settings – update manager, routing & worker settings
 *   GET  /api/mcp      – list configured MCP servers
 *   GET  /api/plugins  – list installed plugins
 *   GET  /api/health   – system health & diagnostics
 *   GET  /...          – serve modern static files from ./public/
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleRunCommand } from '../cli/run.js';
import { listRuns, getRunState } from '../core/run-state.js';
import { getRunDir } from '../core/paths.js';
import { listMcpServers } from '../mcp/mcp-manager.js';
import { listPlugins } from '../plugins/plugin-manager.js';
import { getHealthReport, getWorkersStatus } from '../agents/health.js';
import { loadConfig, saveConfig } from '../core/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, 'public');

export async function startServer(port = process.env.PORT || 3000) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname || '/';

      const sendJson = (status, obj) => {
        res.writeHead(status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end(JSON.stringify(obj));
      };

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
      }

      // API: POST /api/run
      if (req.method === 'POST' && (pathname === '/api/run' || pathname === '/run')) {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const task = payload.task;
            if (!task) {
              return sendJson(400, { error: 'Task description is required' });
            }
            const runResult = await handleRunCommand(task, payload.options || {});
            sendJson(200, {
              status: 'completed',
              runId: runResult.runId,
              plan: runResult.plan,
              results: runResult.results,
              report: runResult.report
            });
          } catch (e) {
            sendJson(500, { error: e.message || 'Run execution failed' });
          }
        });
        return;
      }

      // API: GET /api/workers
      if (req.method === 'GET' && pathname === '/api/workers') {
        const workers = await getWorkersStatus();
        return sendJson(200, { workers });
      }

      // API: GET /api/settings
      if (req.method === 'GET' && pathname === '/api/settings') {
        const config = loadConfig();
        return sendJson(200, {
          config,
          signature: {
            name: "Open-Spider",
            tagline: "Autonomous Multi-Agent Manager AI [Company Orchestration Engine]",
            version: "0.1.0"
          }
        });
      }

      // API: POST /api/settings
      if (req.method === 'POST' && pathname === '/api/settings') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const updates = JSON.parse(body || '{}');
            const current = loadConfig();
            const merged = {
              ...current,
              manager: { ...current.manager, ...(updates.manager || {}) },
              routing: { ...current.routing, ...(updates.routing || {}) },
              workers: { ...current.workers, ...(updates.workers || {}) },
              ui: { ...current.ui, ...(updates.ui || {}) }
            };
            saveConfig(merged);
            return sendJson(200, { ok: true, config: merged });
          } catch (err) {
            return sendJson(500, { error: `Failed to save settings: ${err.message}` });
          }
        });
        return;
      }

      // API: GET /api/runs
      if (req.method === 'GET' && pathname === '/api/runs') {
        const runs = listRuns(30);
        return sendJson(200, { runs });
      }

      // API: GET /api/runs/:id
      if (req.method === 'GET' && pathname.startsWith('/api/runs/')) {
        const runId = pathname.replace('/api/runs/', '');
        const state = getRunState(runId);
        if (!state) return sendJson(404, { error: 'Run not found' });
        return sendJson(200, state);
      }

      // API: GET /api/logs/:id
      if (req.method === 'GET' && (pathname.startsWith('/api/logs/') || pathname.startsWith('/logs/'))) {
        const runId = pathname.replace('/api/logs/', '').replace('/logs/', '');
        const logPath = join(getRunDir(runId), 'run.log');
        if (existsSync(logPath)) {
          res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          createReadStream(logPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Log not found');
        }
        return;
      }

      // API: GET /api/mcp
      if (req.method === 'GET' && (pathname === '/api/mcp' || pathname === '/mcp')) {
        const servers = listMcpServers();
        return sendJson(200, { servers });
      }

      // API: GET /api/plugins
      if (req.method === 'GET' && (pathname === '/api/plugins' || pathname === '/plugins')) {
        const plugins = listPlugins();
        return sendJson(200, { plugins });
      }

      // API: GET /api/health
      if (req.method === 'GET' && pathname === '/api/health') {
        const workerHealth = await getHealthReport();
        const workers = await getWorkersStatus();
        return sendJson(200, {
          status: 'ok',
          uptime: process.uptime(),
          workerHealth,
          workers
        });
      }

      // Static file server
      const safePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const filePath = join(PUBLIC_DIR, safePath);

      if (existsSync(filePath)) {
        const ext = filePath.split('.').pop() || '';
        const mimeTypes = {
          html: 'text/html; charset=utf-8',
          js: 'application/javascript; charset=utf-8',
          css: 'text/css; charset=utf-8',
          svg: 'image/svg+xml',
          json: 'application/json'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      console.log(`Open‑spider web UI listening at http://localhost:${actualPort}`);
      resolve(server);
    });
  });
}
