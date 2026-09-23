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
  - Tasks:
    - [x] `src/data/providers.catalog.js` with master catalog strictly ordered FREE first (OpenRouter, Groq, Cerebras, Google AI Studio, Mistral, NVIDIA NIM, GitHub Models, Ollama) then PAID (OpenAI, DeepSeek, Anthropic, xAI, Together).
    - [x] `src/providers/llm-client.js` OpenAI-compatible `/chat/completions` with JSON mode, exponential backoff retries, and error mapping (`AuthError`, `QuotaError`, `NetworkError`).
    - [x] `src/providers/model-list.js` with 24-hour disk cache in `cache/models.json`, `--refresh`, and Free-First model sorting.
    - [x] `src/providers/providers-store.js` for custom provider persistence in `providers.json`.
    - [x] `src/cli/providers.js` with `list`, `add`, `remove`, `test`, `use` actions.
    - [x] `src/cli/models.js` with filtering (`--free`, `--paid`, `--provider`, `--refresh`).
    - [x] `test/fixtures/fake-provider.mjs` lightweight HTTP mock server.
    - [x] Updated `src/cli/doctor.js` with manager provider and model diagnostics.
  - Acceptance Checks: Catalog and model listings strictly follow FREE first; keys masked (`sk-…abcd`); 429 exponential backoff retry and persistent quota error handling verified with `fake-provider`; `npm test` passes (22/22 tests green).
  - Decisions / Notes: Kept all files < 250 lines. Strict Free-First enforcement in all output layers.
  - Blockers: None.

- [x] **Phase 3 — Worker Adapters** (Done)
  - Status: Pending
  - Acceptance Checks: Fake worker modes classified; `agents list` reports honest status; timeout kills child tree; CLI flags verified via `--help`.

- [x] **Phase 4 — Manager Brain** (Done)
  - Status: Pending
  - Acceptance Checks: Multi-task DAG execution; `[FAILOVER]` triggers on quota; manual pinning works; `--dry-run` plans only; logs saved to `runs/<id>/`.

- [x] **Phase 5 — Setup Wizards**
  - Status: Completed
  - Acceptance Checks: Quick setup (`setup --quick`) succeeded; config stored; doctor reports healthy.

- [x] **Phase 6 — Web UI & Ecosystem API**
  - Status: Completed
  - Acceptance Checks: `open-spider serve` runs HTTP/REST backend & SPA UI; exposes `/api/run`, `/api/runs`, `/api/logs`, `/api/mcp`, `/api/plugins`, `/api/health`; frontend provides dark-matrix dashboard, task runner, log viewer, history inspection, and adapter health; `npm test` passes (28/28 tests green).



- [x] **Phase 7 — Polish & Release**
  - Status: Completed
  - Acceptance Checks: All CLI commands wired (`open-spider`, `run`, `doctor`, `setup`, `agents`, `providers`, `models`, `mcp`, `plugins`, `runs`, `serve`, `mcp-serve`, `config`, `help`); `doctor --deep --json` passes diagnostics cleanly; `npm test` 28/28 green; `npm pack --dry-run` verified; comprehensive README with usage examples & Termux guide completed.

---

## Verified CLI Flags & Signatures
- `agy`: Verified (`1.2.9`)
- `opencode`: Verified (`1.18.32`)
- `hermes`: Verified (`Hermes Agent v0.21.0`)
- `codex`: Verified (`codex-cli 0.156.1`)

