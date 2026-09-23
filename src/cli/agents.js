// src/cli/agents.js
/**
 * CLI commands for managing worker adapters.
 *
 * Commands:
 *   open-spider agents list            – Detect available workers and show health status.
 *   open-spider agents connect         – Run detect on all adapters and record health.
 *   open-spider agents test <worker>   – Run a task through the adapter to verify.
 *   open-spider agents enable <worker>  – Mark worker as healthy in health store.
 *   open-spider agents disable <worker> – Mark worker as unavailable.
 *   open-spider agents integrate       – Show integration config snippet for other agent CLIs.
 */
import { logger } from "../core/logger.js";
import { getHealthReport, recordSuccess, recordFailure, isWorkerAvailable } from "../agents/health.js";
import { CodexAdapter } from "../agents/codex.js";
import { OpencodeAdapter } from "../agents/opencode.js";
import { HermesAdapter } from "../agents/hermes.js";
import { AntigravityAdapter } from "../agents/antigravity.js";
import { CustomAdapter } from "../agents/custom.js";
import { renderTable } from "../ui/table.js";
import { theme } from "../ui/theme.js";

const adapters = {
  codex: CodexAdapter,
  opencode: OpencodeAdapter,
  hermes: HermesAdapter,
  antigravity: AntigravityAdapter,
  custom: CustomAdapter,
};

async function detectAll() {
  const results = {};
  for (const [id, Adapter] of Object.entries(adapters)) {
    try {
      const detected = await Adapter.detect();
      const version = detected ? await Adapter.version() : "N/A";
      results[id] = { detected, version };
    } catch {
      results[id] = { detected: false, version: "error" };
    }
  }
  return results;
}

export async function handleAgentsCommand(action = 'list', target = null) {
  switch (action) {
    case 'list': {
      const detection = await detectAll();
      const health = await getHealthReport();
      const headers = ['Worker', 'Detected', 'Version', 'Health'];
      const rows = [];
      for (const [id, info] of Object.entries(detection)) {
        const healthRec = health[id] || { status: 'healthy' };
        rows.push([
          theme.cyan(id),
          info.detected ? theme.okText('yes') : theme.dim('no'),
          info.version || 'N/A',
          healthRec.status === 'healthy' ? theme.okText(healthRec.status) : theme.warnText(healthRec.status)
        ]);
      }
      console.log(theme.matrix('\n=== OPEN-SPIDER WORKER AGENTS ===\n'));
      console.log(renderTable(headers, rows));
      console.log('');
      break;
    }

    case 'connect': {
      const detection = await detectAll();
      for (const [id, info] of Object.entries(detection)) {
        if (info.detected) {
          await recordSuccess(id);
          logger.ok(`Worker ${theme.highlight(id)} detected (${info.version}) – marked healthy`);
        } else {
          await recordFailure(id, null);
          logger.warn(`Worker ${theme.highlight(id)} not detected on system PATH`);
        }
      }
      break;
    }

    case 'test': {
      if (!target) {
        logger.error('Usage: open-spider agents test <worker>');
        return;
      }
      const Adapter = adapters[target];
      if (!Adapter) {
        logger.fail(`Unknown worker "${target}". Available: ${Object.keys(adapters).join(', ')}`);
        return;
      }
      const { promises: fs } = await import('node:fs');
      const { tmpdir } = await import('node:os');
      const { join } = await import('node:path');
      const tmpPath = join(tmpdir(), `open-spider-${Date.now()}-test.txt`);
      await fs.writeFile(tmpPath, 'Echo test', { mode: 0o600 });
      const task = { id: 'test-1', title: 'Test probe', promptFile: tmpPath };
      const adapter = new Adapter();
      logger.info(`Testing worker adapter: ${target}...`);
      const result = await adapter.run(task);
      if (result.ok) {
        logger.ok(`Worker ${target} succeeded.`);
        await recordSuccess(target);
      } else {
        logger.fail(`Worker ${target} failed with ${result.errorClass?.name || 'Error'}`);
        await recordFailure(target, result.errorClass);
      }
      break;
    }

    case 'enable': {
      if (!target) {
        logger.error('Usage: open-spider agents enable <worker>');
        return;
      }
      await recordSuccess(target);
      logger.ok(`Worker ${theme.highlight(target)} enabled and marked healthy`);
      break;
    }

    case 'disable': {
      if (!target) {
        logger.error('Usage: open-spider agents disable <worker>');
        return;
      }
      await recordFailure(target, new Error('manually disabled'));
      logger.warn(`Worker ${theme.highlight(target)} marked unavailable`);
      break;
    }

    case 'integrate': {
      console.log(theme.matrix('\n=== OPEN-SPIDER INTEGRATION GUIDE ===\n'));
      console.log('To allow other coding agents (e.g. OpenCode, Codex, Hermes, Claude) to use Open-spider as an MCP server:\n');
      console.log(theme.cyan('1. Expose Open-Spider via MCP (stdio):'));
      console.log('   Add the following snippet to your agent\'s MCP configuration (e.g. opencode.json or claude_desktop_config.json):\n');
      console.log(JSON.stringify({
        mcpServers: {
          "open-spider": {
            command: "open-spider",
            args: ["mcp-serve"]
          }
        }
      }, null, 2));
      console.log(`\n${theme.cyan('2. Invoke Open-Spider directly from CLI tools:')}`);
      console.log('   $ open-spider run "Decompose and execute goal" --strategy free-first\n');
      break;
    }

    default:
      logger.warn(`Unknown agents action "${action}". Available: list, connect, test, enable, disable, integrate`);
  }
}
