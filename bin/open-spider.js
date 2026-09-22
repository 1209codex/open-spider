#!/usr/bin/env node

/**
 * @file bin/open-spider.js
 * Open-spider CLI entrypoint.
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
  .version(pkg.version, '-v, --version', 'Output the current version of Open-spider');

// Root action / Interactive REPL (Phase 4 placeholder invocation or Phase 0 intro)
program
  .action(() => {
    console.log(`Open-spider v${pkg.version}`);
    console.log('Use "open-spider help" or "open-spider --help" to view available commands.');
  });

// Core Commands stubbed with clean help signatures for Phase 0
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
  .action(() => {
    console.log('Run command initialized.');
  });

program
  .command('doctor')
  .description('Perform full system and worker health checks')
  .option('--deep', 'Run deep probe execution tests against workers')
  .option('--json', 'Output diagnostics in JSON format')
  .action(() => {
    console.log('Doctor diagnostic check initialized.');
  });

program
  .command('setup')
  .description('Run step-by-step or quick setup wizard')
  .option('-q, --quick', 'Run fast setup wizard in under 60 seconds')
  .action(() => {
    console.log('Setup wizard initialized.');
  });

program
  .command('agents [action]')
  .description('Manage worker agent adapters (list | connect | integrate | enable | disable | test | remove | profile)')
  .action((action) => {
    console.log(`Agents command initialized: ${action || 'list'}`);
  });

program
  .command('providers [action]')
  .description('Manage LLM API providers (list | add | remove | test | use)')
  .action((action) => {
    console.log(`Providers command initialized: ${action || 'list'}`);
  });

program
  .command('models')
  .description('List available models across providers (Free first)')
  .option('--provider <id>', 'Filter by provider ID')
  .option('--free', 'Show free models only')
  .option('--paid', 'Show paid models only')
  .option('--refresh', 'Force refresh model cache from remote APIs')
  .action(() => {
    console.log('Models listing initialized.');
  });

program
  .command('mcp [action]')
  .description('Manage MCP servers and tools (add | add-git | list | remove | test | tools)')
  .action((action) => {
    console.log(`MCP command initialized: ${action || 'list'}`);
  });

program
  .command('plugins [action]')
  .description('Manage Open-spider plugins (list | install | remove | enable | disable)')
  .action((action) => {
    console.log(`Plugins command initialized: ${action || 'list'}`);
  });

program
  .command('runs [action]')
  .description('Manage execution history and resume runs (list | show | resume)')
  .action((action) => {
    console.log(`Runs command initialized: ${action || 'list'}`);
  });

program
  .command('mcp-serve')
  .description('Expose Open-spider itself as an MCP server over stdio')
  .action(() => {
    console.log('MCP server mode initialized.');
  });

program
  .command('config [action] [key] [value]')
  .description('View and modify configuration settings (get | set | path)')
  .action((action, key, value) => {
    console.log(`Config command: ${action || 'get'} ${key || ''} ${value || ''}`);
  });

// Handle custom help command
program
  .command('help [command]')
  .description('Display detailed help and usage examples')
  .action((cmdName) => {
    if (cmdName) {
      const subCmd = program.commands.find((c) => c.name() === cmdName || c.alias() === cmdName);
      if (subCmd) {
        subCmd.help();
        return;
      }
      console.error(`Unknown command: ${cmdName}`);
      process.exitCode = 1;
      return;
    }
    program.help();
  });

program.parse(process.argv);
