#!/usr/bin/env node

/**
 * @file bin/open-spider.js
 * Open-spider CLI entrypoint.
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { displayHelp } from '../src/cli/help.js';
import { runDoctor } from '../src/cli/doctor.js';
import { handleProvidersCommand } from '../src/cli/providers.js';
import { handleModelsCommand } from '../src/cli/models.js';
import { handleAgentsCommand } from '../src/cli/agents.js';
import { handleRunsCommand } from '../src/cli/runs.js';
import { handleConfigCommand } from '../src/cli/config.js';
import { renderBanner } from '../src/ui/banner.js';
import { logger } from '../src/core/logger.js';
import { formatError } from '../src/core/errors.js';
import { handleSetupWizard } from '../src/cli/setup.js';
import { handleRunCommand } from "../src/cli/run.js";
import { handleServeCommand } from "../src/cli/serve.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

const program = new Command();

program
  .name('open-spider')
  .alias('spider')
  .description('Terminal manager AI agent orchestrating external coding-agent CLIs as workers')
  .version(pkg.version, '-v, --version', 'Output the current version of Open-spider')
  .option('--debug', 'Output full error stack traces and internal debug logs');

program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.debug) {
    logger.setDebug(true);
  }
});

import { startInteractiveSession } from '../src/manager/session.js';

const runSafe = (fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error(formatError(err, program.opts().debug));
    process.exit(1);
  }
};

// Root action / Interactive REPL
program.action(runSafe(async () => {
  if (process.stdout.isTTY && !process.env.CI) {
    await startInteractiveSession();
  } else {
    console.log(renderBanner({ version: pkg.version }));
    console.log('Run "open-spider help" to see commands, or "open-spider setup" to configure.\n');
  }
}));

program
  .command('run [task]')
  .description('Run a task with worker planning, decomposition, and execution')
  .option('-w, --worker <id>', 'Pin all subtasks to a specific worker')
  .option('--assign <mapping>', 'Assign subtasks to workers (e.g. t1=codex,t2=hermes)')
  .option('--exclude <ids>', 'Exclude workers by ID (comma-separated)')
  .option('--strategy <type>', 'Routing strategy: free-first | balanced | quality', 'free-first')
  .option('--verify <cmd>', 'Verification command to run after completion')
  .option('--dry-run', 'Generate plan and assignments without executing')
  .option('-y, --yes', 'Automatically approve plan without confirmation')
  .option('--json', 'Output results formatted as JSON')
  .option('--cwd <dir>', 'Working directory for task execution')
  .action(runSafe(handleRunCommand));

program
  .command('doctor')
  .description('Perform full system and worker health checks')
  .option('--deep', 'Run deep probe execution tests against workers')
  .option('--json', 'Output diagnostics in JSON format')
  .action(runSafe(runDoctor));

program
  .command('setup')
  .description('Run step-by-step or quick setup wizard')
  .option('-q, --quick', 'Run fast setup wizard in under 60 seconds')
  .action(runSafe(handleSetupWizard));

program
  .command('agents [action] [target] [extra]')
  .description('Manage worker agent adapters (list | model | connect | integrate | enable | disable | test)')
  .action(runSafe(handleAgentsCommand));

program
  .command('providers [action] [arg1] [arg2]')
  .description('Manage LLM API providers (list | add | remove | test | use)')
  .action(runSafe(handleProvidersCommand));

program
  .command('models')
  .description('List available models across providers (Free first)')
  .option('--provider <id>', 'Filter by provider ID')
  .option('--free', 'Show free models only')
  .option('--paid', 'Show paid models only')
  .option('--refresh', 'Force refresh model cache from remote APIs')
  .action(runSafe(handleModelsCommand));

program
  .command('mcp <action> [args...]')
  .description('Manage MCP servers and tools (add | add-git | list | remove | test | tools)')
  .action(runSafe(async (action = 'list', ...args) => {
    const { handleMcpCommand } = await import('../src/cli/cli-mcp.js');
    await handleMcpCommand(action, ...args);
  }));

program
  .command('plugins [action] [args...]')
  .description('Manage Open-spider plugins (list | install | remove | enable | disable)')
  .action(runSafe(async (action = 'list', ...args) => {
    const { handlePluginsCommand } = await import('../src/cli/cli-plugins.js');
    await handlePluginsCommand(action, ...args);
  }));

program
  .command('skills [action] [arg1] [arg2] [arg3]')
  .description('Manage skills and self-learning from Hermes (list | import-hermes | learn | show | search)')
  .action(runSafe(async (action = 'list', arg1 = null, arg2 = null, arg3 = null) => {
    const { handleSkillsCommand } = await import('../src/cli/cli-skills.js');
    await handleSkillsCommand(action, arg1, arg2, arg3);
  }));

program
  .command('runs [action] [runId]')
  .description('Manage execution history and resume runs (list | show | resume)')
  .action(runSafe(handleRunsCommand));

program
  .command('serve')
  .description('Start web UI dashboard and REST API server')
  .action(runSafe(handleServeCommand));

program
  .command('mcp-serve')
  .description('Expose Open-spider itself as an MCP server over stdio')
  .action(runSafe(async () => {
    const { startMcpStdioServer } = await import('../src/mcp/server.js');
    await startMcpStdioServer();
  }));

program
  .command('config [action] [key] [value]')
  .description('View and modify configuration settings (get | set | path)')
  .action(runSafe(handleConfigCommand));

program
  .command('help [command]')
  .description('Display detailed help and usage examples')
  .action((cmdName) => { displayHelp(cmdName); });

program.helpInformation = () => '';
program.on('--help', () => { displayHelp(); });

program.parse(process.argv);
