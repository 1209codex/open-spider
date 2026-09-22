/**
 * @file src/cli/help.js
 * Custom, grouped, example-rich help screen for Open-spider.
 */

import { theme } from '../ui/theme.js';
import { renderBanner } from '../ui/banner.js';
import { renderBox } from '../ui/box.js';

const COMMAND_DETAILS = {
  run: {
    usage: 'open-spider run "<task>" [options]',
    description: 'Decomposes a goal into subtasks, assigns workers, and executes them.',
    options: [
      ['-w, --worker <id>', 'Pin all subtasks to a specific worker (e.g. codex)'],
      ['--assign <mapping>', 'Assign subtasks explicitly (e.g. t1=codex,t2=hermes)'],
      ['--exclude <ids>', 'Exclude specific workers by ID (comma-separated)'],
      ['--strategy <type>', 'Routing strategy: free-first | balanced | quality (default: free-first)'],
      ['--verify <cmd>', 'Run verification command after task completion'],
      ['--dry-run', 'Generate task plan and routing table without executing'],
      ['-y, --yes', 'Approve plan automatically without prompt'],
      ['--json', 'Output machine-readable JSON results'],
      ['--cwd <dir>', 'Working directory for task execution']
    ],
    examples: [
      'open-spider run "Build a REST API in Express with unit tests"',
      'open-spider run "Refactor database queries" --strategy free-first',
      'open-spider run "Audit dependencies" --worker opencode --dry-run'
    ]
  },
  doctor: {
    usage: 'open-spider doctor [options]',
    description: 'Runs diagnostic health checks on Node, OS, Git, data dir, workers, and providers.',
    options: [
      ['--deep', 'Execute probe commands against detected workers'],
      ['--json', 'Output diagnostic report in JSON format']
    ],
    examples: [
      'open-spider doctor',
      'open-spider doctor --deep'
    ]
  },
  setup: {
    usage: 'open-spider setup [options]',
    description: 'Runs configuration wizard for manager LLMs, workers, routing, and MCPs.',
    options: [
      ['-q, --quick', 'Fast onboarding under 60s with auto-detected workers & free providers']
    ],
    examples: [
      'open-spider setup',
      'open-spider setup --quick'
    ]
  },
  agents: {
    usage: 'open-spider agents <list|connect|integrate|enable|disable|test|remove|profile>',
    description: 'Manage external agent worker CLIs (Antigravity, OpenCode, Hermes, Codex).',
    examples: [
      'open-spider agents list',
      'open-spider agents connect',
      'open-spider agents test codex',
      'open-spider agents integrate'
    ]
  },
  providers: {
    usage: 'open-spider providers <list|add|remove|test|use>',
    description: 'Manage LLM API providers with strict Free-First prioritization.',
    examples: [
      'open-spider providers list',
      'open-spider providers add',
      'open-spider providers test openrouter'
    ]
  },
  models: {
    usage: 'open-spider models [options]',
    description: 'List models across configured providers (Free models first).',
    options: [
      ['--provider <id>', 'Filter by provider ID'],
      ['--free', 'Show free models only'],
      ['--paid', 'Show paid models only'],
      ['--refresh', 'Force refresh cache from remote APIs']
    ],
    examples: [
      'open-spider models',
      'open-spider models --free',
      'open-spider models --provider openrouter'
    ]
  },
  mcp: {
    usage: 'open-spider mcp <add|add-git|list|remove|test|tools>',
    description: 'Connect MCP servers and expose tools to manager & workers.',
    examples: [
      'open-spider mcp list',
      'open-spider mcp add-git anthropics/anthropic-quickstarts',
      'open-spider mcp tools'
    ]
  }
};

/**
 * Renders custom help output.
 * @param {string} [commandName]
 */
export function displayHelp(commandName) {
  if (commandName && COMMAND_DETAILS[commandName]) {
    const detail = COMMAND_DETAILS[commandName];
    console.log(theme.matrix(`\nOPEN-SPIDER COMMAND: ${commandName}\n`));
    console.log(`${theme.dim('Usage:')} ${theme.highlight(detail.usage)}`);
    console.log(`${theme.dim('Description:')} ${detail.description}\n`);

    if (detail.options && detail.options.length > 0) {
      console.log(theme.matrix('Options:'));
      for (const [flag, desc] of detail.options) {
        console.log(`  ${theme.cyan(flag.padEnd(26))} ${desc}`);
      }
      console.log('');
    }

    if (detail.examples && detail.examples.length > 0) {
      console.log(theme.matrix('Examples:'));
      for (const ex of detail.examples) {
        console.log(`  $ ${theme.dim(ex)}`);
      }
      console.log('');
    }
    return;
  }

  console.log(renderBanner());

  const groups = [
    {
      title: 'CORE COMMANDS',
      commands: [
        ['open-spider', 'Launch interactive manager session (REPL)'],
        ['run "<task>"', 'Plan, decompose, and execute task with worker agents'],
        ['doctor', 'System & worker diagnostic health check'],
        ['help [cmd]', 'Show detailed command help and examples']
      ]
    },
    {
      title: 'CONFIGURATION & SETUP',
      commands: [
        ['setup', 'Interactive step-by-step setup wizard'],
        ['setup --quick', 'Fast setup under 60 seconds (free providers first)'],
        ['config <get|set|path>', 'Inspect or modify configuration settings']
      ]
    },
    {
      title: 'WORKERS & PROVIDERS',
      commands: [
        ['agents <list|connect|integrate|...>', 'Manage external worker CLIs'],
        ['providers <list|add|remove|...>', 'Manage LLM API providers'],
        ['models [--free|--paid]', 'List models (Free models listed first)']
      ]
    },
    {
      title: 'ECOSYSTEM & MCP',
      commands: [
        ['mcp <add|add-git|list|tools>', 'Manage MCP servers & gitmcp shortcuts'],
        ['plugins <list|install|...>', 'Manage plugins in ~/.open-spider/plugins'],
        ['runs <list|show|resume>', 'Inspect run history and resume past tasks'],
        ['mcp-serve', 'Run Open-spider itself as an MCP stdio server']
      ]
    }
  ];

  for (const group of groups) {
    console.log(theme.matrix(group.title));
    for (const [cmd, desc] of group.commands) {
      console.log(`  ${theme.cyan(cmd.padEnd(34))} ${theme.dim(desc)}`);
    }
    console.log('');
  }

  console.log(theme.dim('For details on any command: open-spider help <command>\n'));
}
