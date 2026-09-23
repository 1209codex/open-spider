// src/cli/agents.js
/**
 * CLI commands for managing worker adapters and employee models.
 *
 * Commands:
 *   open-spider agents list                  – Detect available workers, models, and live status.
 *   open-spider agents connect               – Run detect on all adapters and record health.
 *   open-spider agents model <worker> [model]– Set default model for a specific worker.
 *   open-spider agents test <worker>         – Run a test probe through the adapter.
 *   open-spider agents enable <worker>        – Mark worker as enabled and healthy.
 *   open-spider agents disable <worker>       – Mark worker as disabled.
 *   open-spider agents integrate             – Show integration config snippet for other agent CLIs.
 */
import { logger } from "../core/logger.js";
import { getWorkersStatus, recordSuccess, recordFailure } from "../agents/health.js";
import { loadConfig, setConfigValue } from "../core/config.js";
import { AGENT_PROFILES } from "../data/agent-profiles.js";
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

export async function handleAgentsCommand(action = 'list', target = null, extra = null) {
  switch (action) {
    case 'list': {
      const detection = await detectAll();
      const workers = await getWorkersStatus(detection);
      const headers = ['Worker Agent', 'Role', 'Status', 'Model & Tier', 'Detected'];
      const rows = [];
      for (const w of workers) {
        let statusDisplay = theme.okText('idle (free)');
        if (w.status === 'working') {
          statusDisplay = theme.cyan('● working');
        } else if (w.status === 'disabled') {
          statusDisplay = theme.dim('disabled');
        } else if (w.status === 'limited') {
          statusDisplay = theme.warnText('limited');
        } else if (w.status !== 'idle') {
          statusDisplay = theme.warnText(w.status);
        }

        const tierBadge = w.modelTier === 'FREE' ? theme.okText('[FREE]') : (w.modelTier === 'PAID' ? theme.warnText('[PAID]') : '');
        const modelStr = `${w.model ? theme.highlight(w.model) : theme.dim('default')} ${tierBadge}`.trim();

        rows.push([
          theme.cyan(w.id),
          theme.dim(w.role || 'Agent'),
          statusDisplay,
          modelStr,
          w.detected ? theme.okText(`yes (${w.version})`) : theme.dim('no')
        ]);
      }
      console.log(theme.matrix('\n=== OPEN-SPIDER EMPLOYEE FLEET ===\n'));
      console.log(renderTable(headers, rows));
      console.log(theme.dim('\nSet worker model: open-spider agents model <worker> <modelId>\n'));
      break;
    }

    case 'model': {
      if (!target) {
        logger.error('Usage: open-spider agents model <worker> [modelId]');
        return;
      }
      if (!adapters[target]) {
        logger.fail(`Unknown worker "${target}". Available: ${Object.keys(adapters).join(', ')}`);
        return;
      }
      if (!extra) {
        // List recommended models for this worker
        const profile = AGENT_PROFILES[target];
        console.log(theme.matrix(`\n=== RECOMMENDED MODELS FOR ${target.toUpperCase()} ===\n`));
        if (profile?.recommendedModels?.length) {
          profile.recommendedModels.forEach((m) => {
            const tierStr = m.free ? theme.okText('[FREE]') : theme.warnText('[PAID]');
            console.log(`  - ${theme.highlight(m.id)} ${tierStr} (${m.name || m.id})`);
          });
        }
        console.log(theme.dim(`\nRun: open-spider agents model ${target} <modelId>\n`));
        return;
      }
      setConfigValue(`workers.${target}.model`, extra);
      logger.ok(`Assigned model ${theme.highlight(extra)} to worker agent ${theme.cyan(target)}`);
      break;
    }

    case 'connect': {
      const detection = await detectAll();
      for (const [id, info] of Object.entries(detection)) {
        if (info.detected) {
          await recordSuccess(id);
          setConfigValue(`workers.${id}.enabled`, true);
          logger.ok(`Worker ${theme.highlight(id)} detected (${info.version}) – connected & healthy`);
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
      await fs.writeFile(tmpPath, 'Echo test probe', { mode: 0o600 });
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
      setConfigValue(`workers.${target}.enabled`, true);
      await recordSuccess(target);
      logger.ok(`Worker ${theme.highlight(target)} enabled`);
      break;
    }

    case 'disable': {
      if (!target) {
        logger.error('Usage: open-spider agents disable <worker>');
        return;
      }
      setConfigValue(`workers.${target}.enabled`, false);
      await recordFailure(target, new Error('manually disabled'));
      logger.warn(`Worker ${theme.highlight(target)} disabled`);
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
      logger.warn(`Unknown agents action "${action}". Available: list, model, connect, test, enable, disable, integrate`);
  }
}
