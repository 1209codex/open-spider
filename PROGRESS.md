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
  - Tasks:
    - [x] Step 0.1: Save `SPEC.md`
    - [x] Step 0.2: Save `AGENTS.md`
    - [x] Step 0.3: Save `PROGRESS.md`
    - [x] Step 0.4: Audit connected MCPs
    - [x] Step 0.5: `git init` (user configured)
    - [x] `package.json` with pure ESM, dependencies, bins (`open-spider`, `spider`), scripts (`start`, `test`)
    - [x] Directory skeleton matching SPEC section 3
    - [x] `bin/open-spider.js` with `--version` and initial help
    - [x] `node:test` runner setup with passing tests
  - Acceptance Checks: `node bin/open-spider.js --version` works; `npm test` passes (5/5 tests green).
  - Decisions / Notes: Set up pure JS dependencies (`commander`, `@clack/prompts`, `picocolors`, `zod`, `execa`, `@modelcontextprotocol/sdk`). Zero native binary addons.
  - Blockers: None.

- [ ] **Phase 1 — Core + UI Kit**
  - Status: Pending
  - Acceptance Checks: Banner renders at 50 and 100 columns; `NO_COLOR=1` and piped output clean; `doctor` prints table; config round-trip test passes.

- [ ] **Phase 2 — Providers & Models**
  - Status: Pending
  - Acceptance Checks: Against `fake-provider`, `providers add` → `test` → `models` works; FREE before PAID ordering; keys masked; 429 backoff/fallback tests pass.

- [ ] **Phase 3 — Worker Adapters**
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
