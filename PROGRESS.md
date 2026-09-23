# Open-spider Progress & Tracking

## MCP Tools Status
- **ponytail**: Connected (`ponytail-docs` & plugin skills) — Delivers minimalist, YAGNI-focused architecture guidelines and code simplicity review.
- **reticle**: Connected (`reticle` MCP with 9 tools & skill suite) — Provides live in-app browser driving, UI state inspection, and runtime verification.
- **pocketbase**: Connected (`pocketbase` MCP & best-practice skill) — Provides schema patterns, collection rules, and backend data modeling guidance.
- **superpower**: Connected (`superpowers` MCP & skill suite) — Provides disciplined TDD workflows, planning mechanics, and agent coordination.

---

## Phase Checklist

- [x] **Phase 0 — Bootstrap**
  - Status: Completed
  - Acceptance Checks: `node bin/open-spider.js --version` works; `npm test` passes (5/5 tests green).

- [x] **Phase 1 — Core + UI Kit**
  - Status: Completed
  - Acceptance Checks: Banner renders at 50 and 100 columns; `NO_COLOR=1` and piped output clean; `doctor` prints table and `--json`; config & secrets round-trip tests pass (13/13 tests green).

- [x] **Phase 2 — Providers & Models**
  - Status: Completed
  - Acceptance Checks: Catalog and model listings strictly follow FREE first; keys masked (`sk-…abcd`); 429 exponential backoff retry and persistent quota error handling verified with `fake-provider`; `npm test` passes (22/22 tests green).

- [x] **Phase 3 — Worker Adapters**
  - Status: Completed
  - Acceptance Checks: Fake worker modes classified; `agents list` reports honest status; timeout kills child tree; CLI flags verified via `--help`.

- [x] **Phase 4 — Manager Brain**
  - Status: Completed
  - Acceptance Checks: Multi-task DAG execution; `[FAILOVER]` triggers on quota; manual pinning works; `--dry-run` plans only; logs saved to `runs/<id>/`.

- [x] **Phase 5 — Setup Wizards**
  - Status: Completed
  - Acceptance Checks: Quick setup (`setup --quick`) succeeded; config stored; doctor reports healthy.

- [x] **Phase 6 — Web UI & Ecosystem API**
  - Status: Completed
  - Acceptance Checks: `open-spider serve` runs HTTP/REST backend & SPA UI; exposes `/api/run`, `/api/runs`, `/api/logs`, `/api/mcp`, `/api/plugins`, `/api/health`; frontend provides dark-matrix dashboard, task runner, log viewer, history inspection, and adapter health.

- [x] **Phase 7 — Polish & Release**
  - Status: Completed
  - Acceptance Checks: All CLI commands wired (`open-spider`, `run`, `doctor`, `setup`, `agents`, `providers`, `models`, `mcp`, `plugins`, `runs`, `serve`, `mcp-serve`, `config`, `help`); `doctor --deep --json` passes diagnostics cleanly; `npm test` 28/28 green; `npm pack --dry-run` verified; comprehensive README with usage examples & Termux guide completed.

- [x] **Phase 8 — Multi-Agent Company Orchestration, Live Status & Settings UI**
  - Status: Completed
  - Tasks:
    - [x] `src/data/agent-profiles.js` default employee roles, descriptions, tags, and recommended models.
    - [x] `src/agents/health.js` live worker state tracking (`idle`, `working`, `limited`, `disabled`, `unavailable`) with active task details.
    - [x] `src/manager/scheduler.js` company pipeline collaboration: parallel DAG stage execution, team context sharing (`sharedContext` injected into dependent prompts), and real-time state transitions.
    - [x] `src/manager/router.js` per-worker model routing, capability routing, and user assignment overrides.
    - [x] `src/cli/agents.js` and `bin/open-spider.js` added `open-spider agents model <worker> <modelId>` CLI configuration.
    - [x] `src/webapp/server.js` added `GET /api/workers`, `GET /api/settings`, and `POST /api/settings` REST API endpoints.
    - [x] `src/webapp/public/index.html`, `style.css`, `app.js` built modern Agent Fleet & Team dashboard, Settings & Model customization screen, live idle/busy polling, and Open-Spider signature branding with SVG logo.
    - [x] `test/multi-agent.test.js` & `test/webapp.test.js` verified live status, model customization, settings persistence, and team context passing.
  - Acceptance Checks: All 34 tests passing (`npm test` 34/34 green); all files < 250 lines; pure ESM; settings round-trip verified.

---

## Verified CLI Flags & Signatures
- `agy`: Verified (`1.2.9`)
- `opencode`: Verified (`1.18.32`)
- `hermes`: Verified (`Hermes Agent v0.21.0`)
- `codex`: Verified (`codex-cli 0.156.1`)
