# AGENTS.md RULES

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
