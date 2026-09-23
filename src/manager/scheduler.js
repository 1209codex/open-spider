// src/manager/scheduler.js
/**
 * Company-style multi-agent scheduler.
 * Executes tasks in parallel DAG stages, shares results/context between agents,
 * and tracks real-time worker busy/idle states.
 */
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { logger } from "../core/logger.js";
import { adapters } from "../agents/index.js";
import { recordSuccess, recordFailure, setWorkerWorking, setWorkerIdle, isWorkerAvailable } from "../agents/health.js";
import { loadConfig } from "../core/config.js";
import { listMcpServers } from "../mcp/mcp-manager.js";
import { invokeMcpTool } from "../mcp/tools-loader.js";

/**
 * Builds collaborative prompt file injecting goal, task instructions, and previous team outputs.
 */
async function prepareCollaborativePrompt(task, sharedContext) {
  const tmpFile = join(tmpdir(), `spider-task-${task.id}-${Date.now()}.txt`);
  let content = `### TASK: ${task.title || task.id}\n\n`;
  content += `INSTRUCTIONS:\n${task.instructions || 'Execute the requested task.'}\n\n`;

  if (task.acceptance && task.acceptance.length > 0) {
    content += `ACCEPTANCE CRITERIA:\n${task.acceptance.map((a) => `- ${a}`).join('\n')}\n\n`;
  }

  if (sharedContext && sharedContext.length > 0) {
    content += `=== SHARED TEAM CONTEXT (FROM PREVIOUS AGENTS) ===\n`;
    for (const ctx of sharedContext) {
      content += `[Agent: ${ctx.worker} | Task: ${ctx.taskId}]\n${ctx.summary || ctx.output || 'Completed'}\n\n`;
    }
  }

  content += `CONSTRAINTS: Deliver precise, working output. Coordinate cleanly with other agents.\n`;
  await fs.writeFile(tmpFile, content, { encoding: 'utf8', mode: 0o600 });
  return tmpFile;
}

/**
 * Executes a single task on its assigned worker adapter or MCP tool.
 */
async function executeTask(task, sharedContext, options = {}) {
  // Handle MCP tool tasks
  if (task.worker && task.worker.startsWith('mcp:')) {
    const [, toolName] = task.worker.split(':');
    const servers = listMcpServers();
    if (servers.length === 0) {
      return { taskId: task.id, worker: task.worker, result: { ok: false, errorClass: new Error('No MCP server configured') } };
    }
    const serverId = servers[0].id;
    logger.task(task.id, `Invoking MCP tool ${toolName} on server ${serverId}`);
    try {
      setWorkerWorking('mcp', task);
      const mcpResult = await invokeMcpTool(serverId, toolName, task.args || {});
      await recordSuccess('mcp');
      return { taskId: task.id, worker: task.worker, result: { ok: true, output: JSON.stringify(mcpResult), summary: `MCP tool ${toolName} executed.` } };
    } catch (err) {
      await recordFailure('mcp', err);
      return { taskId: task.id, worker: task.worker, result: { ok: false, errorClass: err, output: err.message } };
    } finally {
      setWorkerIdle('mcp');
    }
  }

  // Worker adapter execution
  let currentWorker = task.worker || 'codex';
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const AdapterClass = adapters[currentWorker] || adapters.custom;
    const adapter = new AdapterClass();
    const promptPath = task.promptFile || await prepareCollaborativePrompt(task, sharedContext);

    logger.task(task.id, `[Agent: ${currentWorker}] starting task "${task.title || task.id}" (attempt ${attempt})`);
    setWorkerWorking(currentWorker, task);

    try {
      const taskWithPrompt = { ...task, promptFile: promptPath, model: task.model };
      const res = await adapter.run(taskWithPrompt, { cwd: options.cwd || process.cwd() });

      if (res.ok) {
        await recordSuccess(currentWorker);
        logger.ok(`[Agent: ${currentWorker}] completed task ${task.id}`);
        return { taskId: task.id, worker: currentWorker, result: res };
      }

      // Record failure and check for failover
      await recordFailure(currentWorker, res.errorClass);
      logger.warn(`[Agent: ${currentWorker}] task ${task.id} failed (${res.errorClass?.name || 'Error'})`);

      // Automatic failover to another healthy worker
      const fallbackList = ['opencode', 'codex', 'hermes', 'antigravity'].filter((w) => w !== currentWorker);
      let nextWorker = null;
      for (const candidate of fallbackList) {
        if (await isWorkerAvailable(candidate)) {
          nextWorker = candidate;
          break;
        }
      }

      if (nextWorker && attempt < maxAttempts) {
        logger.warn(`[FAILOVER] ${currentWorker} -> ${nextWorker} (reason: ${res.errorClass?.name || 'failed'})`);
        currentWorker = nextWorker;
      } else {
        return { taskId: task.id, worker: currentWorker, result: res };
      }
    } catch (err) {
      await recordFailure(currentWorker, err);
      return { taskId: task.id, worker: currentWorker, result: { ok: false, errorClass: err, output: err.message } };
    } finally {
      setWorkerIdle(currentWorker);
    }
  }

  return { taskId: task.id, worker: currentWorker, result: { ok: false, errorClass: new Error('Exceeded max retry attempts') } };
}

/**
 * Runs routed tasks in parallel DAG stages, passing shared outputs between agents.
 */
export async function runTasks(routedTasks, options = {}) {
  let config = {};
  try {
    config = loadConfig();
  } catch {
    config = {};
  }
  const concurrency = config.routing?.concurrency || 2;
  const completedResults = [];
  const sharedContext = [];
  const pending = [...routedTasks];
  const finishedTaskIds = new Set();

  while (pending.length > 0) {
    // Find tasks whose dependencies are satisfied
    const readyTasks = pending.filter((t) => {
      if (!t.depends_on || t.depends_on.length === 0) return true;
      return t.depends_on.every((depId) => finishedTaskIds.has(depId));
    });

    const batch = (readyTasks.length > 0 ? readyTasks : [pending[0]]).slice(0, concurrency);

    // Execute batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (task) => {
        const res = await executeTask(task, sharedContext, options);
        return { task, res };
      })
    );

    for (const { task, res } of batchResults) {
      completedResults.push(res);
      finishedTaskIds.add(task.id);
      const idx = pending.findIndex((p) => p.id === task.id);
      if (idx !== -1) pending.splice(idx, 1);

      // Add to shared team collaboration context
      sharedContext.push({
        taskId: task.id,
        worker: res.worker,
        output: res.result?.output || '',
        summary: res.result?.summary || res.result?.output?.slice(0, 300) || 'Success'
      });
    }
  }

  return completedResults;
}
