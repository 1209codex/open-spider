// src/manager/session.js
/**
 * Interactive Manager AI REPL session.
 * Accepts interactive tasks and slash commands for live orchestration.
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { renderBanner } from '../ui/banner.js';
import { theme } from '../ui/theme.js';
import { logger } from '../core/logger.js';
import { loadConfig, setConfigValue } from '../core/config.js';
import { handleRunCommand } from '../cli/run.js';
import { handleAgentsCommand } from '../cli/agents.js';
import { handleRunsCommand } from '../cli/runs.js';
import { handleMcpCommand } from '../cli/cli-mcp.js';
import { getWorkersStatus } from '../agents/health.js';
import { planTask } from './planner.js';
import { routeTasks } from './router.js';
import { renderTable } from '../ui/table.js';

/**
 * Handles individual slash commands.
 */
export async function executeSlashCommand(cmdLine, sessionState = {}) {
  const parts = cmdLine.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case '/help':
      console.log(theme.matrix('\n=== OPEN-SPIDER SLASH COMMANDS ===\n'));
      console.log(`  ${theme.cyan('/plan <task>')}            Decompose and inspect plan without running`);
      console.log(`  ${theme.cyan('/workers')}                Show worker fleet, models, and live status`);
      console.log(`  ${theme.cyan('/use <provider/model>')}    Switch manager provider or model`);
      console.log(`  ${theme.cyan('/pin <task|all> <worker>')} Pin task or entire session to worker`);
      console.log(`  ${theme.cyan('/exclude <worker>')}        Exclude a worker from task routing`);
      console.log(`  ${theme.cyan('/enable <worker>')}         Enable a worker`);
      console.log(`  ${theme.cyan('/disable <worker>')}        Disable a worker`);
      console.log(`  ${theme.cyan('/model <worker> <model>')}  Assign model to worker`);
      console.log(`  ${theme.cyan('/status')}                 Show current session config & health`);
      console.log(`  ${theme.cyan('/runs')}                   Show recent execution runs`);
      console.log(`  ${theme.cyan('/mcp')}                    List configured MCP servers`);
      console.log(`  ${theme.cyan('/clear')}                  Clear terminal screen`);
      console.log(`  ${theme.cyan('/quit')} or ${theme.cyan('/exit')}        Exit interactive session\n`);
      break;

    case '/workers':
      await handleAgentsCommand('list');
      break;

    case '/plan': {
      const task = args.join(' ');
      if (!task) {
        logger.warn('Usage: /plan <task description>');
        break;
      }
      logger.info(`Planning goal: ${task}`);
      const plan = await planTask(task);
      const routed = await routeTasks(plan, sessionState.strategy || 'free-first', {
        worker: sessionState.pinnedWorker,
        assign: sessionState.assignments
      });
      console.log(theme.matrix(`\nPlan: ${plan.summary || task}\n`));
      const headers = ['Task ID', 'Kind', 'Assigned Worker', 'Model', 'Instructions'];
      const rows = routed.map((t) => [
        theme.cyan(t.id),
        t.kind || 'general',
        theme.highlight(t.worker || 'auto'),
        theme.dim(t.model || 'default'),
        t.instructions ? (t.instructions.length > 40 ? t.instructions.slice(0, 37) + '...' : t.instructions) : ''
      ]);
      console.log(renderTable(headers, rows));
      console.log('');
      break;
    }

    case '/pin': {
      if (args.length < 2) {
        logger.warn('Usage: /pin <all|taskId> <workerId>');
        break;
      }
      const [target, worker] = args;
      if (target === 'all') {
        sessionState.pinnedWorker = worker;
        logger.ok(`Pinned all session tasks to worker [${theme.highlight(worker)}]`);
      } else {
        sessionState.assignments = sessionState.assignments ? `${sessionState.assignments},${target}=${worker}` : `${target}=${worker}`;
        logger.ok(`Pinned task ${target} to worker [${theme.highlight(worker)}]`);
      }
      break;
    }

    case '/exclude': {
      if (args.length < 1) {
        logger.warn('Usage: /exclude <workerId>');
        break;
      }
      sessionState.excluded = sessionState.excluded || [];
      sessionState.excluded.push(args[0]);
      logger.ok(`Excluded worker [${theme.highlight(args[0])}] from session routing`);
      break;
    }

    case '/enable':
      if (args[0]) await handleAgentsCommand('enable', args[0]);
      else logger.warn('Usage: /enable <worker>');
      break;

    case '/disable':
      if (args[0]) await handleAgentsCommand('disable', args[0]);
      else logger.warn('Usage: /disable <worker>');
      break;

    case '/model':
      if (args.length >= 2) await handleAgentsCommand('model', args[0], args[1]);
      else logger.warn('Usage: /model <worker> <modelId>');
      break;

    case '/use': {
      if (!args[0]) {
        logger.warn('Usage: /use <provider> [model] or /use <provider/model>');
        break;
      }
      const val = args[0];
      if (val.includes('/')) {
        const [prov, ...rest] = val.split('/');
        const mod = rest.join('/');
        setConfigValue('manager.provider', prov);
        setConfigValue('manager.model', mod);
        logger.ok(`Switched manager to provider [${prov}] with model [${mod}]`);
      } else {
        setConfigValue('manager.provider', val);
        if (args[1]) setConfigValue('manager.model', args[1]);
        logger.ok(`Switched manager provider to [${val}]`);
      }
      break;
    }

    case '/status': {
      const config = loadConfig();
      const workers = await getWorkersStatus();
      const onlineCount = workers.filter((w) => w.status === 'idle' || w.status === 'working').length;
      console.log(theme.matrix('\n=== OPEN-SPIDER SESSION STATUS ===\n'));
      console.log(`  ${theme.dim('Manager Provider:')}  ${theme.highlight(config.manager?.provider || 'openrouter')}`);
      console.log(`  ${theme.dim('Manager Model:')}     ${theme.highlight(config.manager?.model || 'default')}`);
      console.log(`  ${theme.dim('Workers Ready:')}     ${theme.okText(`${onlineCount}/${workers.length} active`)}`);
      console.log(`  ${theme.dim('Routing Strategy:')}  ${theme.cyan(config.routing?.strategy || 'free-first')}`);
      console.log(`  ${theme.dim('Concurrency:')}       ${theme.cyan(String(config.routing?.concurrency || 2))}`);
      if (sessionState.pinnedWorker) {
        console.log(`  ${theme.dim('Session Pin:')}       ${theme.warnText(sessionState.pinnedWorker)}`);
      }
      if (sessionState.excluded?.length) {
        console.log(`  ${theme.dim('Excluded Workers:')}  ${theme.warnText(sessionState.excluded.join(', '))}`);
      }
      console.log('');
      break;
    }

    case '/runs':
      await handleRunsCommand('list');
      break;

    case '/mcp':
      await handleMcpCommand('list');
      break;

    case '/clear':
      console.clear();
      break;

    case '/quit':
    case '/exit':
      return 'exit';

    default:
      logger.warn(`Unknown slash command "${command}". Type /help to see all available commands.`);
  }
}

/**
 * Starts interactive manager REPL loop.
 */
export async function startInteractiveSession() {
  const config = loadConfig();
  console.log(renderBanner({
    manager: config.manager?.model || 'gemini-2.5-flash',
    workers: '4/4 online',
    mcp: 0
  }));
  console.log(theme.matrix('Type your goal to dispatch, or /help for slash commands. Press Ctrl+C to exit.\n'));

  const rl = createInterface({ input, output, prompt: theme.matrix('spider> ') });
  const sessionState = {
    strategy: config.routing?.strategy || 'free-first',
    pinnedWorker: null,
    assignments: null,
    excluded: []
  };

  rl.prompt();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      continue;
    }

    if (trimmed.startsWith('/')) {
      const res = await executeSlashCommand(trimmed, sessionState);
      if (res === 'exit') {
        rl.close();
        break;
      }
    } else {
      // Execute task
      try {
        console.log('');
        await handleRunCommand(trimmed, {
          strategy: sessionState.strategy,
          worker: sessionState.pinnedWorker,
          assign: sessionState.assignments
        });
      } catch (err) {
        logger.fail(`Task execution error: ${err.message}`);
      }
      console.log('');
    }

    rl.prompt();
  }

  console.log(theme.dim('\nSession closed. Goodbye!\n'));
}
