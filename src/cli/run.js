// src/cli/run.js
/**
 * Implementation of the `open-spider run "<task>"` command.
 * It ties together the manager brain: planner → router → scheduler → synthesizer.
 */
import { logger } from "../core/logger.js";
import { planTask } from "../manager/planner.js";
import { routeTasks } from "../manager/router.js";
import { runTasks } from "../manager/scheduler.js";
import { synthesizeResults } from "../manager/synthesizer.js";
import { createRun, saveRunState } from "../core/run-state.js";
import { getRunDir } from "../core/paths.js";
import { join } from "node:path";

export async function handleRunCommand(taskDescription, options = {}) {
  const runRecord = createRun(taskDescription, options);
  const logFile = join(getRunDir(runRecord.id), 'run.log');
  logger.setActiveLogFile(logFile);

  try {
    logger.info(`Run ID: ${runRecord.id}`);
    logger.info(`Planning task: ${taskDescription}`);
    
    const plan = await planTask(taskDescription);
    runRecord.plan = plan;
    saveRunState(runRecord.id, runRecord);
    logger.info(`Plan summary: ${plan.summary}`);

    const routed = await routeTasks(plan, options.strategy);
    saveRunState(runRecord.id, runRecord);

    const results = await runTasks(routed);
    runRecord.results = results;
    
    const report = synthesizeResults(results);
    runRecord.summary = report;
    runRecord.status = results.every(r => r.result?.ok) ? 'completed' : 'failed';
    saveRunState(runRecord.id, runRecord);

    if (options.json) {
      console.log(JSON.stringify({ runId: runRecord.id, plan, routed, results, report }, null, 2));
    }
    return { runId: runRecord.id, plan, routed, results, report };
  } catch (err) {
    runRecord.status = 'failed';
    runRecord.error = err.message;
    saveRunState(runRecord.id, runRecord);
    logger.fail(`Run command failed: ${err.message}`);
    throw err;
  } finally {
    logger.setActiveLogFile(null);
  }
}
