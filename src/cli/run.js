// src/cli/run.js
/**
 * Implementation of the `open-spider run "<task>"` command.
 * Coordinates manager pipeline: planner → router → scheduler → synthesizer → verification.
 */
import { logger } from "../core/logger.js";
import { planTask } from "../manager/planner.js";
import { routeTasks } from "../manager/router.js";
import { runTasks } from "../manager/scheduler.js";
import { synthesizeResults } from "../manager/synthesizer.js";
import { createRun, saveRunState } from "../core/run-state.js";
import { getRunDir } from "../core/paths.js";
import { join } from "node:path";
import { execa } from "execa";

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

    const routed = await routeTasks(plan, options.strategy, options);
    saveRunState(runRecord.id, runRecord);

    if (options.dryRun || options['dry-run']) {
      logger.info('Dry-run completed. Plan and assignments generated without execution.');
      runRecord.status = 'completed';
      runRecord.summary = 'Dry-run plan generated.';
      saveRunState(runRecord.id, runRecord);
      if (options.json) {
        console.log(JSON.stringify({ runId: runRecord.id, plan, routed }, null, 2));
      }
      return { runId: runRecord.id, plan, routed, results: [], report: 'Dry-run plan generated.' };
    }

    const results = await runTasks(routed, { ...options, runId: runRecord.id });
    runRecord.results = results;
    
    let report = synthesizeResults(results);

    // Optional verification command execution
    if (options.verify) {
      logger.info(`Running verification command: "${options.verify}"...`);
      try {
        const verifyRes = await execa(options.verify, { shell: true, cwd: options.cwd || process.cwd() });
        logger.ok(`Verification succeeded:\n${verifyRes.stdout || 'OK'}`);
        report += `\n\n🔍 Verification (${options.verify}): PASSED\n${verifyRes.stdout || ''}`;
      } catch (verifyErr) {
        logger.fail(`Verification failed:\n${verifyErr.stderr || verifyErr.stdout || verifyErr.message}`);
        report += `\n\n🔍 Verification (${options.verify}): FAILED\n${verifyErr.stderr || verifyErr.stdout || verifyErr.message}`;
      }
    }

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
