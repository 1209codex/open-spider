# Open‑spider

A terminal‑based AI manager that orchestrates external coding‑agent CLIs as workers.

## Prerequisites

- **Node.js** >= 20 (ESM support)
- A **Linux** environment (including Termux on Android). No native addons are required; the project uses only pure‑JavaScript dependencies.

## Installation

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/your‑org/open-spider.git
cd open-spider

# Install dependencies
npm ci
```

## Running the CLI

The entry point is `bin/open-spider.js`. The command is installed as `open-spider` (and alias `spider`) when you run `npm link` or install globally.

```bash
# From the project root
node bin/open-spider.js           # Show the interactive banner / REPL

# Or, after linking globally
npm link                         # Makes `open-spider` available in $PATH
open-spider --help               # Show custom help
open-spider run "Write a README"  # Example one‑shot task
```

### Common Commands

| Command | Description |
|--------|-------------|
| `open-spider` | Starts the interactive manager (REPL). |
| `open-spider run "<task>"` | One‑shot execution of a task. |
| `open-spider agents list` | List detected worker adapters and their health. |
| `open-spider providers list` | Show configured LLM providers. |
| `open-spider doctor` | Run health checks (add `--deep` for exhaustive probing). |
| `open-spider setup` | Interactive setup wizard (add `--quick` for fast mode). |
## Extended Commands

### MCP (Managed Compute Providers)

- `open-spider mcp add <url>` – register a new MCP server.
- `open-spider mcp list` – list configured MCP servers.
- `open-spider mcp tools <id>` – list available tools on a server.
- `open-spider mcp remove <id>` – delete a server.

MCP tasks can be invoked using the `mcp:` prefix, e.g.:

```bash
open-spider run "Fetch example.com" --worker=mcp:fetch_generic_url_content
```

### Plugins

- `open-spider plugins list` – show installed plugins.
- `open-spider plugins install <npm-spec>` – install a plugin.
- `open-spider plugins remove <name>` – uninstall a plugin.

Plugins are loaded from `~/.open-spider/plugins` and can extend the CLI with new commands.

## Configuration

All runtime data lives under `~/.open-spider/` (or the directory defined by `OPEN_SPIDER_HOME`). The files are:

- `config.json` – manager preferences (provider, model, routing strategy).
- `secrets.json` – API keys (chmod 600 for security).
- `agents.json` – registered worker adapters.
- `runs/` – per‑run logs and output.

You can edit them directly or use the built‑in CLI commands (`config get|set`, `providers add|remove`, etc.).

## Development

```bash
# Run the test suite
npm test

# Lint / format (if you add ESLint/Prettier later)
# npm run lint
```

## License

MIT © 2026 Shanu (and contributors).
