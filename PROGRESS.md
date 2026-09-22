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

- [ ] **Phase 4 — Manager Brain**
  - Status: Pending
  - Acceptance Checks: Multi-task DAG execution; `[FAILOVER]` triggers on quota; manual pinning works; `--dry-run` plans only; logs saved to `runs/<id>/`.

- [ ] **Phase 5 — Setup Wizards**
  - Status: Pending
  - Acceptance Checks: Scripted end-to-end run for `setup --quick` and `setup` in isolated `OPEN_SPIDER_HOME`.

- [ ] **Phase 6 — MCP + Plugins + Integrate**
  - Status: Pending
  - Acceptance Checks: Stdio test MCP connects; `add-git` creates proper gitmcp URLs; plugin isolation works; `agents integrate` generates correct diffs.

- [ ] **Phase 7 — Polish & Release**
  - Status: Pending
  - Acceptance Checks: All commands work; `doctor --deep --json` passes; `npm test` green; README complete.

---

## Verified CLI Flags & Signatures
*(To be populated in Phase 3 via `<cli> --help`)*
- `agy`: Pending verification
- `opencode`: Pending verification
- `hermes`: Pending verification
- `codex`: Pending verification
