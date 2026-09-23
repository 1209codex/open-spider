# Web Application Plan for Open‑Spider

## Goal
Provide a minimal web UI (`open‑spider serve`) that allows users to submit tasks, view logs, and inspect MCP servers and plugins via a browser.

## Architecture
- **Entry point**: new CLI sub‑command `serve` (see `src/cli/serve.js`).
- **Server**: lightweight HTTP server using only Node built‑ins (`http`, `url`, `fs`). No external dependencies (keeps within pure‑JS rule).
- **Endpoints**
  - `POST /run` – accepts JSON `{ task: string, options?: object }`. Calls the existing `handleRunCommand` from `src/cli/run.js` programmatically and returns a run‑id.
  - `GET /logs/:id` – streams the log file for the given run‑id from the brain directory.
  - `GET /mcp` – returns the list of registered MCP servers (via `mcp list`).
  - `GET /plugins` – returns installed plugins (via `plugins list`).
  - `GET /` – serves static files from `src/webapp/public/` (HTML/JS UI).
- **Static UI** (`src/webapp/public/index.html` + simple JS) provides a form to submit a task and a pane to display the result and logs.

## Files to Add
| Path | Purpose | Approx. Lines |
|------|---------|--------------|
| `src/cli/serve.js` | CLI wrapper that imports and starts the server. | 30 |
| `src/webapp/server.js` | HTTP server implementation, routing, and integration with existing CLI commands. | 120 |
| `src/webapp/public/index.html` | Minimal UI (form + result area). | 60 |
| `src/webapp/public/app.js` | Client‑side script for AJAX calls. | 80 |

## New Dependency
- **None** – using only Node core modules, satisfying the *no native addon* rule.

## Acceptance Criteria
1. `node bin/open-spider.js serve` starts a server on `localhost:3000`.
2. `POST /run` returns a JSON `{ runId: "<id>" }` and the task executes successfully (same behavior as CLI `run`).
3. `GET /logs/<id>` streams the corresponding log file.
4. `GET /mcp` and `GET /plugins` return JSON arrays reflecting current state.
5. Opening `http://localhost:3000/` shows the UI, allows task submission, and displays the final output.
6. All existing tests (`npm test`) still pass.

## Implementation Steps
1. Add `serve` command to `bin/open-spider.js` (register `src/cli/serve.js`).
2. Implement `src/webapp/server.js` with routing logic.
3. Add static UI files under `src/webapp/public/`.
4. Update `PROGRESS.md` to include **Web UI** pending.
5. Write tests `test/webapp.test.js` using `node:test` and a mocked worker.
6. Run `npm test` and validate manually.

## Risks & Mitigations
- **Port conflict** – default to `3000`; allow `PORT` env var.
- **Security** – only expose minimal endpoints; no auth needed for local dev.
- **Performance** – streaming logs directly, no buffering.

---
*Prepared by Antigravity (AGY) following AGENTS.md rules.*
