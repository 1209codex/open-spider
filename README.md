# Open-spider 🕷️

> Terminal manager AI agent orchestrating external coding-agent CLIs as workers.

Open-spider acts as an engineering manager: it takes high-level goals, decomposes them into structured subtasks with clear acceptance criteria, intelligently routes each task to the most capable (or free) coding agent CLI (Codex, OpenCode, Hermes, Antigravity, or custom workers), coordinates execution with failover, and synthesizes a final verified report.

---

## ⚡ Key Highlights
- **Manager Brain**: LLM-driven planner with automatic JSON repair, DAG task scheduler, failover recovery, and multi-model fallbacks.
- **Worker Orchestration**: Native adapters for **Codex CLI (`codex`)**, **OpenCode (`opencode`)**, **Hermes Agent (`hermes`)**, and **Antigravity (`agy`)**, plus user-defined custom worker templates.
- **Strict Free-First Philosophy**: Master catalog prioritizing generous free LLM providers (OpenRouter free models, Groq, Cerebras, Google AI Studio, Mistral, NVIDIA NIM, Ollama) before paid providers.
- **Cross-Platform & Mobile Ready**: 100% pure JavaScript, ESM, zero native addons. Runs seamlessly on Linux, macOS, and **Android/Termux (ARM64)** down to 50-column terminal displays.
- **Modern Web UI Dashboard**: Includes built-in dark-matrix web UI (`open-spider serve`) with live task streaming, execution history, MCP registry, and worker health monitors.
- **MCP & Plugin Ecosystem**: Seamlessly bridges MCP tools and loads user plugins from `~/.open-spider/plugins/`.

---

## 🚀 Installation & Quick Start

### Prerequisites
- **Node.js** >= 20.0.0
- **Git**

### Installation

#### Global Install / Linking
```bash
# Clone the repository
git clone https://github.com/shanu/open-spider.git
cd open-spider

# Install dependencies & link
npm install
npm link
```

#### Android (Termux)
```bash
pkg update && pkg install nodejs git
git clone https://github.com/shanu/open-spider.git
cd open-spider
npm install
npm link
```

---

## 🛠️ Quick Setup (Under 60 Seconds)

Run the automated quick onboarding wizard:
```bash
open-spider setup --quick
```

Or run system health diagnostics:
```bash
open-spider doctor
open-spider doctor --deep --json
```

---

## 📖 Command Reference & Examples

| Command | Description | Example |
|---|---|---|
| `open-spider` | Interactive Manager REPL with status banner | `open-spider` |
| `open-spider run "<task>"` | Plan, decompose, route, and execute goal | `open-spider run "Build a REST API in Node.js"` |
| `open-spider serve` | Launch Web UI dashboard & REST API server | `open-spider serve` |
| `open-spider doctor` | Diagnostics for Node, OS, Git, secrets & workers | `open-spider doctor --deep` |
| `open-spider setup` | Interactive configuration wizard | `open-spider setup` |
| `open-spider agents <action>` | Manage worker adapters (list, connect, test, enable, disable, integrate) | `open-spider agents list` |
| `open-spider providers <action>`| Manage LLM API providers (list, add, remove, test, use) | `open-spider providers list` |
| `open-spider models` | List available models across providers (Free first) | `open-spider models --free` |
| `open-spider mcp <action>` | Manage MCP servers (add, add-git, list, remove, tools) | `open-spider mcp add-git owner/repo` |
| `open-spider plugins <action>` | Manage plugins (list, install, remove) | `open-spider plugins list` |
| `open-spider runs <action>` | Inspect run history or resume (list, show, resume) | `open-spider runs list` |
| `open-spider mcp-serve` | Expose Open-spider itself as an MCP server over stdio | `open-spider mcp-serve` |
| `open-spider config <action>` | View and modify configuration settings | `open-spider config get manager.model` |
| `open-spider help [command]` | Rich custom help and usage examples | `open-spider help run` |

---

## 🎯 Worker Adapters & Heuristics

| Worker CLI | Binary | Specialization / Capability Tags |
|---|---|---|
| **Codex CLI** | `codex` | Backend, refactor, debug, unit tests, code review |
| **OpenCode** | `opencode` | General coding, quick edits, devops, free-model runs |
| **Hermes Agent** | `hermes` | Research, automation, multi-tool scripting, docs |
| **Antigravity** | `agy` | Frontend, UI, multi-file changes, architecture planning |
| **Custom Worker** | *custom* | Configured via custom command template (e.g. `["mycli", "{promptFile}"]`) |

---

## 🌐 Web UI Dashboard

Start the local web dashboard:
```bash
open-spider serve
```
Open **http://localhost:3000** in your browser to dispatch tasks, view live decompiled subtask plans, tail worker stdout/stderr in real-time, inspect past run histories, and check worker health.

---

## 🔒 Configuration & Storage

All persistent configuration and runtime state is stored in `~/.open-spider/` (override with `OPEN_SPIDER_HOME`):

- `config.json`: Manager provider, default model, routing strategy, and failover preferences.
- `secrets.json`: API keys stored with strict `0600` file permissions.
- `providers.json`: User-configured custom LLM providers.
- `mcp.json`: Registered Model Context Protocol endpoints.
- `runs/<runId>/`: Task logs (`run.log`) and execution state (`state.json`).
- `cache/`: Model catalogs and worker health caches (`health.json`).
- `plugins/`: Extensible user-installed plugin packages.

---

## 🧪 Testing

Run the full automated test suite (pure JavaScript with built-in `node:test`):
```bash
npm test
```

---

## 📄 License

MIT © 2026 Open-Spider Contributors
