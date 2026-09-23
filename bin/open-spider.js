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
import { renderBanner } from '../src/ui/banner.js';
import { logger } from '../src/core/logger.js';
import { formatError } from '../src/core/errors.js'; import { handleSetupWizard } from '../src/cli/setup.js';
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

// Root action / Interactive REPL
program
  .action(() => {
    console.log(renderBanner({ version: pkg.version }));
    console.log('Run "open-spider help" to see commands, or "open-spider setup" to configure.\n');
  });

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
  .action(async (task, options) => {
    try {
      await handleRunCommand(task, options);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Perform full system and worker health checks')
  .option('--deep', 'Run deep probe execution tests against workers')
  .option('--json', 'Output diagnostics in JSON format')
  .action(async (options) => {
    try {
      await runDoctor(options);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Run step-by-step or quick setup wizard')
  .option('-q, --quick', 'Run fast setup wizard in under 60 seconds')
  .action(async (options) => {
    try {
      await handleSetupWizard(options);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
    logger.info('Setup wizard invocation...');
  });

program
  .command('agents [action]')
  .description('Manage worker agent adapters (list | connect | integrate | enable | disable | test | remove | profile)')
  .action((action) => {
    logger.info(`Agents command: ${action || 'list'}`);
  });

program
  .command('providers [action] [arg1] [arg2]')
  .description('Manage LLM API providers (list | add | remove | test | use)')
  .action(async (action, arg1, arg2) => {
    try {
      await handleProvidersCommand(action, arg1, arg2);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });

program
  .command('models')
  .description('List available models across providers (Free first)')
  .option('--provider <id>', 'Filter by provider ID')
  .option('--free', 'Show free models only')
  .option('--paid', 'Show paid models only')
  .option('--refresh', 'Force refresh model cache from remote APIs')
  .action(async (options) => {
    try {
      await handleModelsCommand(options);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });

program
  .command('mcp <action> [args...]')
  .description('Manage MCP servers and tools (add | add-git | list | remove | test | tools)')
  .action(async (action = 'list', ...args) => {
    try {
      const { handleMcpCommand } = await import('../src/cli/cli-mcp.js');
      await handleMcpCommand(action, ...args);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });

program
  .command('plugins [action]')
  .description('Manage Open-spider plugins (list | install | remove | enable | disable)')
  .action(async (action = 'list', ...args) => {
    try {
      const { handlePluginsCommand } = await import('../src/cli/cli-plugins.js');
      await handlePluginsCommand(action, ...args);
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start minimal web UI for Open‑spider')
  .action(() => {
    try {
      handleServeCommand();
    } catch (err) {
      console.error(formatError(err, program.opts().debug));
      process.exit(1);
    }
  });


program
  .command('mcp-serve')
  .description('Expose Open-spider itself as an MCP server over stdio')
  .action(() => {
    logger.info('MCP-serve mode initialized.');
  });

program
  .command('config [action] [key] [value]')
  .description('View and modify configuration settings (get | set | path)')
  .action((action, key, value) => {
    logger.info(`Config command: ${action || 'get'} ${key || ''} ${value || ''}`);
  });

// Handle custom help command
program
  .command('help [command]')
  .description('Display detailed help and usage examples')
  .action((cmdName) => {
    displayHelp(cmdName);
  });

// Override default help output to use custom displayHelp
program.helpInformation = () => '';
program.on('--help', () => {
  displayHelp();
});

program.parse(process.argv);
