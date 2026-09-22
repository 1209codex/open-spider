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

export async function handleRunCommand(taskDescription, options) {
  try {
    logger.info(`Planning task: ${taskDescription}`);
    const plan = await planTask(taskDescription);
    logger.info(`Plan summary: ${plan.summary}`);
    const routed = await routeTasks(plan, options.strategy);
    const results = await runTasks(routed);
    const report = synthesizeResults(results);
    if (options.json) {
      console.log(JSON.stringify({ plan, routed, results, report }, null, 2));
    }
    return report;
  } catch (err) {
    logger.fail(`Run command failed: ${err.message}`);
    throw err;
  }
}
