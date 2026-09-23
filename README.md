# Open-spider 🕷️

> Terminal manager AI agent orchestrating external coding-agent CLIs as employees in a collaborative company workflow.

Open-spider acts as an engineering manager: it takes high-level goals, decomposes them into structured subtasks with clear acceptance criteria, intelligently routes each task to the most capable (or free) coding agent CLI (Codex, OpenCode, Hermes, Antigravity, or custom workers), coordinates execution with shared team context and failover, and synthesizes a final verified report.

---

## ⚡ Key Highlights
- **Company-Style Multi-Agent Collaboration**: Orchestrates employee agents simultaneously in parallel DAG stages, seamlessly passing inputs, outputs, and intermediate results from one worker to dependent workers.
- **Per-Worker Model Selection**: Customize the AI model used by each employee agent (e.g. Codex → `gpt-4o`, OpenCode → `claude-3-5-sonnet`, Hermes → `llama-3.3-70b`, Antigravity → `gemini-2.5-pro`) from either the Web Settings UI or the CLI.
- **Live Fleet Tracking (Busy vs Free)**: Real-time dashboard showing which workers are actively working on tasks and which are idle and free for new assignments.
- **Strict Free-First Philosophy**: Master catalog prioritizing generous free LLM providers (OpenRouter free models, Groq, Cerebras, Google AI Studio, Mistral, NVIDIA NIM, Ollama) before paid providers.
- **Cross-Platform & Mobile Ready**: 100% pure JavaScript, ESM, zero native addons. Runs seamlessly on Linux, macOS, and **Android/Termux (ARM64)** down to 50-column terminal displays.
- **Modern Web UI Dashboard & Settings**: Includes dark-matrix cyber web UI (`open-spider serve`) with live task streaming, agent fleet inspector, settings screen, execution history, MCP registry, and worker diagnostics.
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
| `open-spider agents list` | List worker agents, roles, models, and live status | `open-spider agents list` |
| `open-spider agents model <worker> <model>` | Set default model for a specific worker | `open-spider agents model codex gpt-4o` |
| `open-spider agents <enable\|disable>` | Enable or disable a worker agent | `open-spider agents enable antigravity` |
| `open-spider providers <action>`| Manage LLM API providers (list, add, remove, test, use) | `open-spider providers list` |
| `open-spider models` | List available models across providers (Free first) | `open-spider models --free` |
| `open-spider mcp <action>` | Manage MCP servers (add, add-git, list, remove, tools) | `open-spider mcp add-git owner/repo` |
| `open-spider plugins <action>` | Manage plugins (list, install, remove) | `open-spider plugins list` |
| `open-spider runs <action>` | Inspect run history or resume (list, show, resume) | `open-spider runs list` |
| `open-spider mcp-serve` | Expose Open-spider itself as an MCP server over stdio | `open-spider mcp-serve` |
| `open-spider config <action>` | View and modify configuration settings | `open-spider config get manager.model` |
| `open-spider help [command]` | Rich custom help and usage examples | `open-spider help run` |

---

## 🎯 Worker Fleet & Specializations

| Worker CLI | Binary | Role & Specialization | Default Recommended Model |
|---|---|---|---|
| **Codex CLI** | `codex` | Backend logic, refactoring, comprehensive tests, code review | `gpt-4o` |
| **OpenCode** | `opencode` | Fullstack development, quick edits, devops, free-model runs | `claude-3-5-sonnet` |
| **Hermes Agent** | `hermes` | Deep research, automation, multi-tool scripting, docs | `meta-llama/llama-3.3-70b-instruct` |
| **Antigravity** | `agy` | Frontend, UI/UX components, multi-file refactors, architecture | `google/gemini-2.5-pro` |
| **Custom Worker** | *custom* | User-defined command templates (e.g. `["mycli", "{promptFile}"]`) | Custom |

---

## 🌐 Web UI Dashboard & Settings

Start the local web dashboard:
```bash
open-spider serve
```
Open **http://localhost:3000** in your browser to:
- **Task Orchestration**: Dispatch goals with real-time decompiled subtask plans and live streaming logs.
- **Agent Fleet**: Real-time inspection of active workers (`BUSY / WORKING` vs `FREE / IDLE`), assigned models, and live task details.
- **Settings & Models**: Customize AI models per agent, configure manager LLM, set concurrency (up to 4 parallel workers), and toggle agents.
- **Runs History**: Inspect past decomposed plans and full worker logs.
- **MCP & Plugins**: Manage external MCP servers and tools.

---

## 🔒 Configuration & Storage

All persistent configuration and runtime state is stored in `~/.open-spider/` (override with `OPEN_SPIDER_HOME`):

- `config.json`: Manager provider, default models, worker model overrides, routing strategy, and failover preferences.
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
