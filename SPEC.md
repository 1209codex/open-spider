# ROLE
You are a senior Node.js CLI engineer. Build **Open-spider** from scratch in the current directory, one phase at a time. Quality bar: production-grade, no stubs, no fake output, every command works end-to-end.

# STEP 0 — DO THIS BEFORE ANYTHING ELSE
1. Save this entire message verbatim as `SPEC.md` in the project root. It is the source of truth. Re-read it after any context reset.
2. Create `AGENTS.md` from the section "AGENTS.md RULES" at the bottom of this message.
3. Create `PROGRESS.md`: a checklist of Phases 0–7 with status, decisions, blockers.
4. Check which MCP tools you have: **ponytail, reticle, pocketbase, superpower**. List each one that is connected with a one-line description of what it offers. Use them wherever they genuinely fit (planning/TDD/debug workflow, code navigation, docs lookup, data inspection). If one is missing or errors, skip it, note it in PROGRESS.md, and continue. Never block on an MCP.
5. `git init` (set a local `user.name`/`user.email` if missing) and start Phase 0.
6. Work on ONE phase at a time. When its acceptance checks pass: update PROGRESS.md, `git commit`, print `PHASE N DONE`, then STOP and wait for me to say `next`.

# 1. PRODUCT
Open-spider is a terminal app (Node.js) — a **manager AI agent** that uses other coding-agent CLIs as **employees**.

- **Manager** = Open-spider itself, powered by an LLM through API providers the user configures (free providers first).
- **Workers** = external agent CLIs: **Antigravity CLI (`agy`)**, **OpenCode (`opencode`)**, **Hermes Agent (`hermes`)**, **Codex CLI (`codex`)**. Extensible: user can add any CLI via a command template.
- **Flow**: user gives a task → manager plans → splits into subtasks → assigns each subtask to the worker best suited for it → runs them (parallel where safe) → collects results → optional verification → final report.
- **Manual control**: the user can pin/override the worker for any subtask at any time. If a worker runs out of credits / hits a rate limit, work automatically fails over to another worker (or the user switches manually).

# 2. HARD TECH CONSTRAINTS
- Node.js >= 20, **ESM** (`"type": "module"`), plain **JavaScript + JSDoc**. No TypeScript, no bundler, no build step.
- Must run on **Android/Termux (ARM64, unrooted)** and Linux/macOS. **NO native addons** (no node-pty, better-sqlite3, sharp, etc.). Pure-JS dependencies only. Prefer built-ins: `fetch`, `node:test`, `node:child_process`, `node:fs/promises`, `node:readline`.
- Allowed dependencies: `commander`, `@clack/prompts`, `picocolors`, `zod`, `execa`, `@modelcontextprotocol/sdk`. Anything else needs a written reason in PROGRESS.md and must be pure JS.
- Package name `open-spider`. Bin names: `open-spider` and alias `spider`.
- Data dir: `~/.open-spider/` (override with `OPEN_SPIDER_HOME`) containing `config.json`, `providers.json`, `agents.json`, `mcp.json`, `secrets.json` (chmod 600), `runs/<runId>/`, `plugins/`, `cache/`. Use `$HOME`-based paths. Do not assume XDG dirs, `xdg-open`, or a desktop.
- Terminal can be ~50 columns wide (phone). All UI must adapt to `process.stdout.columns`, respect `NO_COLOR`, and degrade cleanly when stdout is not a TTY (no animation, plain text, `--json` where relevant).

# 3. PROJECT STRUCTURE (keep files small, one responsibility, < 250 lines each)
```
open-spider/
  bin/open-spider.js
  src/
    cli/        commander wiring, one file per command
    ui/         theme, banner, box, table, spinner, prompt helpers
    core/       config, secrets, logger, errors, paths, run-state
    providers/  catalog, llm-client (OpenAI-compatible), model-list
    agents/     base-adapter, codex.js, opencode.js, hermes.js, antigravity.js, custom.js, health.js
    manager/    planner, router, scheduler, failover, synthesizer, session (REPL)
    mcp/        client-manager, gitmcp, tools-bridge, server (mcp-serve)
    plugins/    loader, api
    data/       providers.catalog.js, agent-profiles.js
  test/         fixtures/fake-worker.mjs, fixtures/fake-provider.mjs, *.test.js
  SPEC.md  AGENTS.md  PROGRESS.md  README.md
```

# 4. COMMANDS
| Command | Purpose |
|---|---|
| `open-spider` (no args) | Interactive manager session (REPL). Shows banner + status, accepts tasks and slash commands |
| `run "<task>"` | One-shot. Flags: `--worker <id>` (pin all), `--assign t1=codex,t2=hermes`, `--exclude id,id`, `--strategy free-first|balanced|quality`, `--verify "<cmd>"`, `--dry-run` (plan only), `--yes`, `--json`, `--cwd <dir>` |
| `help [command]` | Custom, grouped, example-rich help (do not rely on commander's default look) |
| `doctor [--deep] [--json]` | Full health check (see section 12) |
| `setup` | Manual step-by-step setup wizard |
| `setup --quick` | Quick setup, under 60 seconds |
| `agents list | connect | integrate | enable | disable | test | remove | profile` | Manage workers |
| `providers list | add | remove | test | use` | Manage LLM API providers |
| `models [--provider id] [--free] [--paid] [--refresh]` | Model lists (ordering rules in section 7) |
| `mcp add | add-git | list | remove | test | tools` | Manage MCP servers |
| `plugins list | install | remove | enable | disable` | Manage plugins |
| `runs list | show | resume` | Run history |
| `mcp-serve` | Expose Open-spider itself as an MCP server (stdio) |
| `config get | set | path` | Config access |

**Definitions (follow exactly):**
- `agents connect` = register an external agent CLI as a **worker** for Open-spider (auto-detect binary, or custom command template, test it, set models/tags/permission mode).
- `agents integrate` = the reverse direction: let other agents use Open-spider. Offer to (a) print/write an MCP config entry that launches `open-spider mcp-serve` into another agent's config (opencode `opencode.json`, codex `config.toml`, etc. — always show a diff and ask before writing), and (b) show how to call `open-spider run` from other agents as a shell tool.

**REPL slash commands:** `/help /plan /workers /use <id> /pin <task> <worker> /exclude <id> /enable <id> /status /retry <task> /abort /runs /mcp /quit`.

# 5. MANAGER BRAIN
**Planner** — one LLM call producing JSON validated with zod:
```json
{ "summary": "string",
  "tasks": [ { "id": "t1", "title": "string", "instructions": "string",
    "kind": "frontend|backend|tests|refactor|debug|research|docs|devops|review|other",
    "depends_on": ["t0"], "write": true,
    "suggested_worker": "codex", "why": "string", "acceptance": ["string"] } ] }
```
- Invalid JSON/schema → one automatic repair retry with the validation error. Still invalid → fall back to a single-task plan routed by the router.
- Before planning, the manager may pull context via MCP tools (e.g. gitmcp docs) and inject it into task instructions.
- Show the plan as a table. Unless `--yes`, let the user approve, reassign a task to another worker, edit, or cancel.

**Router** — decides the worker per task. Precedence: (1) manual pin → (2) user exclusions → (3) worker health (skip `limited`/`unauthenticated`/`unavailable`) → (4) capability score (task `kind` vs worker tags, plus planner's `suggested_worker` as a hint) → (5) strategy (`free-first` prefers workers running on free models/quota, `quality`, `balanced`) → (6) current load.
- Default capability tags live in `src/data/agent-profiles.js` and are **editable heuristics**, not facts. Ship sensible defaults: codex → backend, refactor, debug, tests, review; opencode → general, quick edits, free-model runs; hermes → research, automation, scripting, multi-tool; antigravity → frontend, UI, multi-file changes, planning.

**Scheduler** — DAG execution by `depends_on`, configurable concurrency (default 2 on mobile, max 4).
- Git repo: each write task runs in its own `git worktree` on branch `spider/<runId>/<taskId>`; after success the manager merges branches sequentially; on conflict stop and report clearly (never force).
- Not a git repo: write tasks run sequentially in the working dir with a visible warning; only read-only tasks run in parallel.

**Failover** — classify each failure: `quota` (rate limit / credits / 429 / billing / usage limit / resource exhausted / too many requests) → mark worker `limited` with cooldown (parse "retry after" if present, else 60 min) and switch; `auth` → mark `unauthenticated`, don't retry that worker; `timeout` → retry once, then switch; `crash/unknown` → switch. Max 3 different workers per task. Config `failover: auto|ask|off`. Always print a line like `[FAILOVER] codex -> opencode (reason: quota)`. Persist health in `cache/health.json`.

**Worker prompt template** (per task): overall goal, this task's instructions, results of dependency tasks, acceptance criteria, constraints ("touch only what is needed; do not modify unrelated files"), and a required final summary (files changed, commands run, result).

**Synthesizer** — after all tasks: collect final message, exit code, duration, changed files (`git diff --stat`), run `--verify` command if given, then produce a final report (LLM call, with a plain non-LLM fallback report).

**Manager LLM resilience** — `manager.provider`, `manager.model`, and `manager.fallbacks: [{provider, model}]`. If the manager model is rate-limited, fall through to the next fallback with a visible notice. Retry with exponential backoff.

# 6. WORKER ADAPTERS
Common interface (`base-adapter.js`): `detect()`, `version()`, `listModels()`, `buildCommand(task, opts)`, `run(task, opts) -> {ok, exitCode, output, summary, durationMs, errorClass, raw}`, `classifyError(stderr, stdout, exitCode)`. Run with `execa`/`spawn`, `stdin` closed or piped, hard timeout (default 20 min, configurable per worker), kill process tree on timeout/abort, stream output to a run log file, and show a live tail in the UI.

**Do not trust flags written here blindly.** Before writing each adapter, run `<cli> --help` and the relevant subcommand help, compare with the table, and prefer what the real binary says. Record the verified flags in PROGRESS.md. If a CLI isn't installed, build the adapter from this table, mark it `unverified`, and test it only with the fake worker.

| Worker | Binary | Headless command (best-known) | Notes |
|---|---|---|---|
| Codex | `codex` | `codex exec --full-auto --skip-git-repo-check -C <dir> [-m <model>] "<prompt>"` (prompt can also come via stdin with `-`) | `--json` streams JSONL events (`turn.completed`, `turn.failed`, `item.completed`); `-o <file>` writes final message. Default exec sandbox is read-only, so write tasks need `--full-auto`. "YOLO" mode = `--dangerously-bypass-approvals-and-sandbox` |
| OpenCode | `opencode` | `opencode run [--dir <dir>] [-m <provider/model>] [--dangerously-skip-permissions] "<prompt>"` | `opencode models` lists models. `--format json` gives raw events but has had missing-output bugs, so use default text output as primary |
| Hermes | `hermes` | `hermes chat -q "<prompt>" -Q [--provider <p>] [--model <m>] [--max-turns N]` or `hermes -z "<prompt>"` (final answer only) | `--format stream-json` needs `-q`; one-shot exit code reflects the turn outcome |
| Antigravity | `agy` (verify; may differ) | `agy -p "<prompt>" [--model "<display name>"] [--print-timeout <s>] [--dangerously-skip-permissions]` | `agy models` lists models; `--output-format json` optional. **Known issue:** some versions print nothing or hang when stdout is not a TTY. Implement a fallback: if there is zero output after N seconds or exit 0 with empty output, retry through `script -qec '<cmd>' /dev/null` when `script` exists (no node-pty!) |

- **Permission modes** per worker: `safe` (default, no bypass flags) and `yolo` (maps to each CLI's skip-permissions/bypass flag). Enabling `yolo` requires an explicit typed confirmation.
- **Custom agents**: `command` template with placeholders `{prompt} {cwd} {model} {promptFile}`, plus `detectCmd`, `modelsCmd`, `errorPatterns`.
- **Wrapper support**: a worker's command may be prefixed (e.g. `proot-distro login ubuntu --`) so CLIs without an Android build can run inside proot on Termux.
- `doctor`/`agents test` must handle: binary missing, binary present but not runnable (wrong arch), not logged in, no credits.

# 7. PROVIDERS & MODELS
- `src/data/providers.catalog.js`: `{id, name, baseUrl, type: "openai-compatible", envKey, free: boolean, freeNote, modelsPath}`. Best-known defaults (doctor verifies; user can edit):
  - **FREE tier**: `groq` https://api.groq.com/openai/v1 · `openrouter` https://openrouter.ai/api/v1 (free models = pricing 0 or id ends `:free`) · `cerebras` https://api.cerebras.ai/v1 · `google-ai-studio` https://generativelanguage.googleapis.com/v1beta/openai/ · `mistral` https://api.mistral.ai/v1 · `nvidia-nim` https://integrate.api.nvidia.com/v1 · `github-models` https://models.github.ai/inference · `ollama` http://localhost:11434/v1 (local, no key)
  - **PAID**: `openai` https://api.openai.com/v1 · `anthropic` (via its OpenAI-compatible endpoint first; native later if time) · `deepseek` https://api.deepseek.com/v1 · `xai` https://api.x.ai/v1 · `together` https://api.together.xyz/v1
  - **Custom**: any OpenAI-compatible base URL + key.
- **Ordering rule (strict)**: everywhere providers are listed (`providers list`, `models`, wizards): **FREE PROVIDERS first, then PAID PROVIDERS**. Inside each provider: **FREE MODELS first, then PAID MODELS**. Use clear section headers.
- Models: fetch live from `GET <baseUrl>/models` when a key exists, cache 24h in `cache/`, `--refresh` forces reload. Free/paid detection via pricing fields when available, else a curated list in the catalog. If live fetch fails, show the curated fallback labelled `curated (may be outdated)`.
- LLM client: OpenAI-compatible `/chat/completions` via built-in `fetch`, streaming support, JSON-mode when supported, retries with backoff, clear error classes (auth, quota, network, bad-model).
- `providers add`: choose from the catalog (free group first) or custom → masked key input → test call → save. Keys go to `secrets.json` (0600) or reference an env var; never print or log keys (mask as `sk-…abcd`).

# 8. MCP
- Client manager built on `@modelcontextprotocol/sdk`: transports **stdio**, **Streamable HTTP**, **SSE** (try Streamable HTTP first for URLs, fall back to SSE).
- `mcp add <name> <url|command…>`; `mcp add-git <owner/repo>` is a shortcut that registers `https://gitmcp.io/<owner>/<repo>`. Also accept a full `https://gitmcp.io/...` URL directly (and the generic `https://gitmcp.io/docs` endpoint).
- `mcp test <name>` connects, lists tools, prints count + names. `mcp tools` lists tools across all servers.
- Manager can call MCP tools during planning (e.g. fetch repo docs) and inject the results into worker prompts. Tool calls are shown in the UI; unknown/destructive tools ask for confirmation.
- `mcp-serve`: expose `open-spider_run`, `open-spider_plan`, `open-spider_status` tools over stdio so other agents can use Open-spider (this powers `agents integrate`).

# 9. PLUGINS
Folder `~/.open-spider/plugins/<name>/` with `plugin.json` (`name, version, main, permissions`) and an ESM entry exporting `register(api)`. `api` offers: `registerAdapter(adapter)`, `registerCommand(def)`, `registerProvider(def)`, `on('plan'|'taskStart'|'taskResult'|'runEnd', fn)`. Loader isolates failures: a broken plugin is reported by `doctor` and never crashes the app. `plugins install <path|git-url>` copies/clones and validates the manifest.

# 10. UI / UX — "HACKER" STYLE
- Palette: matrix green on black, dim green for secondary, amber for warnings, red for errors, cyan for highlights. Central `theme.js`; nothing hardcodes colors elsewhere.
- Startup banner: compact ASCII spider + `OPEN-SPIDER vX.Y.Z` + status line (`manager: <model> | workers: 3/4 online | mcp: 2`). A shorter banner when columns < 60. Optional short typing/boot animation (skippable with any key, disabled if not TTY or `--no-anim`).
- Status prefixes: `[ OK ]` `[WARN]` `[FAIL]` `[INFO]` `[FAILOVER]` `[TASK t2]`. Boxed panels, aligned tables, spinner for waiting states, live worker output tail with a worker-colored tag.
- Prompts via `@clack/prompts` themed to match. Every error = short human message + `hint:` line; stack traces only with `--debug`.
- Build the small UI kit yourself (`box`, `table`, `spinner`, `banner`) — no heavy UI dependencies.

# 11. SETUP WIZARDS
- **Quick setup** (`setup --quick`): detect installed workers → pick one provider (free list first) → enter key → pick a recommended manager model → enable detected workers with default profiles and `free-first` strategy → run a mini `doctor` → print "ready" with 3 example commands.
- **Manual setup** (`setup`): step-by-step screens with back/skip: manager model + fallbacks → providers → workers (paths, command templates, models, tags, permission mode, timeouts) → routing strategy + failover mode → MCP servers → plugins → UI options (animation, theme) → concurrency. Everything editable later through the same commands. Idempotent — re-running never destroys existing config without asking.

# 12. DOCTOR
Checks: Node version, platform (detect Termux via `PREFIX` containing `com.termux`), git, data-dir permissions, `secrets.json` mode 600, each worker (binary found, version, runnable; with `--deep` a 1-line probe prompt with a short timeout), each provider (key present + `GET /models` reachable), manager model reachable, MCP servers (connect + tool count), plugins load. Output a table with `[ OK ] / [WARN] / [FAIL]` and a `fix:` hint on every non-OK row. Exit code 1 if any FAIL. `--json` for machine output.

# 13. SECURITY
No telemetry. Never log/print secrets. Manager never executes arbitrary shell itself except through worker adapters, `git`, and the user-supplied `--verify` command. Confirm before `yolo`, before writing to other agents' config files, and before destructive git operations. Sanitize task text passed to shells (no string-concatenated shell commands; pass args as arrays).

# 14. TESTING
Use `node:test`. Build `test/fixtures/fake-worker.mjs` (modes: success, quota-error, auth-error, timeout, empty-output, crash) and `test/fixtures/fake-provider.mjs` (local HTTP server mimicking `/models` and `/chat/completions`, incl. 429). All failover, routing, planner-repair, and provider-ordering logic must be tested against these fakes, so nothing depends on real credits or network. `npm test` must pass at the end of every phase.

# 15. PHASES (do one, verify, commit, stop)

**Phase 0 — Bootstrap.** Steps 0.1–0.6 above. `package.json` (bin, scripts: start, test), folder skeleton, `bin/open-spider.js` with `--version` and placeholder-free `help`. *Accept:* `node bin/open-spider.js --version` and `help` work; `npm test` runs (even with 1 trivial test).

**Phase 1 — Core + UI kit.** paths, config store, secrets store (0600), logger, error classes, theme, banner, box, table, spinner, prompt helpers; custom `help [command]`; first `doctor` skeleton (Node/platform/git/data-dir). *Accept:* banner renders at 50 and 100 columns, `NO_COLOR=1` and piped output are clean; `doctor` prints a table; config round-trip test passes.

**Phase 2 — Providers & models.** Catalog, LLM client, model listing with cache, `providers list|add|remove|test|use`, `models`. *Accept:* against `fake-provider`, `providers add` → `test` → `models` works; output shows FREE PROVIDERS before PAID PROVIDERS and FREE MODELS before PAID MODELS; keys are masked; 429 → backoff/fallback test passes.

**Phase 3 — Worker adapters.** Base adapter, 4 adapters + custom, detection, health, error classification, timeouts + process-tree kill, `agents list|connect|integrate(dry-run only)|enable|disable|test|remove|profile`. Verify each real CLI's flags via `--help` where installed. *Accept:* all fake-worker modes classify correctly; `agents list` shows installed/missing/unverified honestly; timeout kills the child.

**Phase 4 — Manager brain.** Planner (+repair), router, scheduler (worktrees + sequential fallback), failover, synthesizer, run state, `run`, `runs`, REPL with slash commands, manual pin/`--assign`/`--exclude`. *Accept:* with fake provider + fake workers: a 3-task plan runs with dependencies; a quota-failing worker triggers `[FAILOVER]` to another; `--worker` pin is respected; `--dry-run` only plans; run logs saved under `runs/<id>/`.

**Phase 5 — Setup wizards.** `setup --quick` and `setup`. *Accept:* scripted end-to-end run (env `OPEN_SPIDER_HOME` in a temp dir, fakes) completes both wizards and `doctor` passes.

**Phase 6 — MCP + plugins + integrate.** MCP client (stdio/HTTP/SSE), `mcp` commands incl. `add-git`, planner tool bridge, `mcp-serve`, plugin loader/API, real `agents integrate` (diff + confirm). *Accept:* a local test MCP server (stdio) connects and its tools list; `mcp add-git owner/repo` stores the correct gitmcp URL; a sample plugin registers a command and a broken plugin is isolated.

**Phase 7 — Polish & release.** Full `doctor --deep --json`, README (install on Termux + Linux/macOS, quick start, every command with an example, worker flag table, troubleshooting), `npm pack` sanity check, `npm link` smoke test, final QA against this SPEC section by section. *Accept:* every command in section 4 exists and works; `npm test` green; README examples run as written; PROGRESS.md fully checked.

# AGENTS.md RULES (copy this section into AGENTS.md)
1. At the start of every session read `AGENTS.md`, `SPEC.md`, `PROGRESS.md`.
2. One phase at a time. Finish → run acceptance checks → update PROGRESS.md → `git commit` → print `PHASE N DONE` → wait for `next`. Never start the next phase on your own.
3. Small files (< 250 lines), one responsibility, ESM only, JSDoc types, no TypeScript, no build step.
4. No native addons, ever. Before adding a dependency check it is pure JS; log the reason in PROGRESS.md.
5. Never invent CLI flags or API behavior. Run `--help` / read docs / test first. If unverifiable, mark `unverified` and say so.
6. No placeholder code, no `TODO` stubs, no fake success output in a finished phase. If something cannot be tested for real (credits, network), test with the fakes and say clearly that it was tested with fakes.
7. Every user-facing error = short message + `hint:`. Stack traces only with `--debug`.
8. Never print or log secrets. Never write outside the project dir or `~/.open-spider/` (except confirmed integrate writes).
9. If the same problem fails 3 attempts, stop, write the blocker + what you tried into PROGRESS.md, and ask me.
10. MCP tools (ponytail, reticle, pocketbase, superpower): use them when they fit, skip silently if unavailable, never block on them.
11. Keep replies short: what changed, commands run, test results, next step. No long explanations.
