// src/manager/scheduler.js
/**
 * Simple task scheduler – runs tasks respecting dependencies (DAG) and concurrency.
 * For this prototype we assume no complex dependencies; tasks are run sequentially.
 * If `task.write` is true, the task may modify files – run on its own git worktree.
 */
import { logger } from "../core/logger.js";
import { adapters } from "../agents/index.js";
import { recordSuccess, recordFailure } from "../agents/health.js";
import { getConfigValue } from "../core/config.js";
import { listMcpServers } from "../mcp/mcp-manager.js";
import { invokeMcpTool } from "../mcp/tools-loader.js";

export async function runTasks(routedTasks) {
  const results = [];
  for (const task of routedTasks) {
    // If worker is an MCP tool (format: "mcp:<toolName>")
    if (task.worker && task.worker.startsWith('mcp:')) {
      const [, toolName] = task.worker.split(':');
      const servers = listMcpServers();
      if (servers.length === 0) {
        logger.fail('No MCP servers configured for MCP task');
        results.push({ taskId: task.id, worker: task.worker, result: { ok: false, errorClass: new Error('No MCP server') } });
        continue;
      }
      const serverId = servers[0].id; // simple selection of first server
      logger.task(task.id, `Invoking MCP tool ${toolName} on server ${serverId}`);
      try {
        const mcpResult = await invokeMcpTool(serverId, toolName, task.args || {});
        await recordSuccess('mcp');
        logger.ok(`MCP task ${task.id} succeeded`);
        results.push({ taskId: task.id, worker: task.worker, result: { ok: true, data: mcpResult } });
      } catch (err) {
        await recordFailure('mcp', err);
        logger.fail(`MCP task ${task.id} failed: ${err.message}`);
        results.push({ taskId: task.id, worker: task.worker, result: { ok: false, errorClass: err } });
      }
      continue;
    }
    // Normal worker flow
    const AdapterClass = adapters[task.worker] || adapters.custom;
    const adapter = new AdapterClass();
    logger.task(task.id, `Executing on worker ${task.worker}`);
    const result = await adapter.run(task, { cwd: process.cwd() });
    if (result.ok) {
      await recordSuccess(task.worker);
      logger.ok(`Task ${task.id} succeeded`);
    } else {
      await recordFailure(task.worker, result.errorClass);
      logger.fail(`Task ${task.id} failed: ${result.errorClass?.name || "Error"}`);
    }
    results.push({ taskId: task.id, worker: task.worker, result });
  }
  return results;
}
