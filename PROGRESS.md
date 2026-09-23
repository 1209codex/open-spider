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
  - Acceptance Checks: Multi-agent parallel execution, context sharing, live busy/idle status, per-worker model customization, settings screen, vector logo, and branding. `npm test` 34/34 green.

- [x] **Phase 9 — Interactive Manager REPL & Slash Command Session**
  - Status: Completed
  - Acceptance Checks: Interactive readline REPL with live status banner, slash command dispatcher (`/help`, `/plan`, `/workers`, `/use`, `/pin`, `/exclude`, `/enable`, `/disable`, `/model`, `/status`, `/runs`, `/mcp`, `/clear`, `/quit`). `npm test` 40/40 green.

- [x] **Phase 10 — Worktree Isolation & Post-Run Verification**
  - Status: Completed
  - Acceptance Checks: Git worktree branches (`spider/<runId>/<taskId>`), sequential merges, `--verify "<cmd>"`. `npm test` 42/42 green.

- [x] **Phase 11 — Comprehensive Model Catalog & [FREE] / [PAID] Selection**
  - Status: Completed
  - Tasks:
    - [x] `src/data/agent-profiles.js` enriched recommended models with free/paid indicators.
    - [x] `src/providers/model-list.js` added `getAllCuratedModels()` and `getModelTier()` with strict Free-First ordering.
    - [x] `src/webapp/server.js` added `GET /api/models` endpoint and worker tier badges.
    - [x] `src/webapp/public/index.html`, `style.css`, `app.js` implemented grouped model dropdown selectors, custom model inputs, neon `[FREE]` / `[PAID]` badges, and Master Models Catalog Explorer.
    - [x] `src/cli/agents.js` added tier labels to `open-spider agents list` and `open-spider agents model <worker>`.
    - [x] `test/models-catalog.test.js` verified catalog aggregation, free-first ordering, and tier classification.
  - Acceptance Checks: `npm test` 46/46 green; all files < 250 lines; pure ESM.

- [x] **Phase 12 — Hermes Skills Replication & Self-Learning System**
  - Status: Completed
  - Tasks:
    - [x] `src/skills/hermes-importer.js`: Recursive discovery and YAML frontmatter parsing of Hermes `SKILL.md` files without external dependencies.
    - [x] `src/skills/skills-manager.js`: Skills registry store (`~/.open-spider/skills/skills.json`), foundational built-in skills, `learnSkill()`, `importHermesSkills()`, `findRelevantSkills()`, and `buildSkillsGuidanceContext()`.
    - [x] `src/cli/cli-skills.js`: CLI command handlers (`list`, `import-hermes`, `learn`, `show`, `search`).
    - [x] `bin/open-spider.js` & `src/cli/help.js`: Wired `open-spider skills` command and comprehensive examples.
    - [x] `src/manager/planner.js` & `src/manager/scheduler.js`: Auto-injection of relevant skills guidance into planner decomposition prompts and worker collaborative instructions.
    - [x] `src/manager/session.js`: Added `/skills` and `/learn` REPL slash commands.
    - [x] `src/webapp/server.js`: Added REST API endpoints (`GET /api/skills`, `POST /api/skills/learn`, `POST /api/skills/import-hermes`).
    - [x] `src/webapp/public/`: Added **🧠 Skills & Self-Learning** UI tab, Hermes importer button, learn skill modal, search & tag filter, and instruction viewer.
    - [x] `test/skills.test.js`: Verified Hermes parser, self-learning store, keyword search, context injection, and REST API.
  - Acceptance Checks: `npm test` 55/55 green; all files < 250 lines; pure ESM.

- [x] **Phase 13 — Live Event Streaming (SSE / Web UI Real-Time Updates)**
  - Status: Completed
  - Tasks:
    - [x] `src/core/events.js`: Central in-memory `SpiderEventBus` emitting task output chunks, worker status, and lifecycle events.
    - [x] `src/agents/health.js` & `src/agents/base-adapter.js`: Integrated live worker state changes and real-time process stdout/stderr chunk forwarding.
    - [x] `src/manager/scheduler.js`: Integrated `task:started`, `task:completed`, and `task:failed` state broadcasting.
    - [x] `src/webapp/server.js`: Implemented `GET /api/events` Server-Sent Events (SSE) stream endpoint with keep-alive and disconnect cleanup.
    - [x] `src/webapp/public/app.js`: Connected frontend `EventSource('/api/events')` to stream live execution logs and fleet activity in real-time.
    - [x] `test/events-sse.test.js`: Verified event bus emissions, payload structure, and HTTP SSE streaming.
  - Acceptance Checks: `npm test` 58/58 green; all files < 250 lines; pure ESM.

---

## Verified CLI Flags & Signatures
- `agy`: Verified (`1.2.9`)
- `opencode`: Verified (`1.18.32`)
- `hermes`: Verified (`Hermes Agent v0.21.0`)
- `codex`: Verified (`codex-cli 0.156.1`)
