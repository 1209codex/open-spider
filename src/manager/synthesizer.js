// src/manager/synthesizer.js
/**
 * Synthesizer – after all tasks have run, produce a final report.
 * For this prototype it simply aggregates task results and prints a summary.
 */
import { logger } from "../core/logger.js";

export function synthesizeResults(taskResults) {
  const successes = taskResults.filter((r) => r.result.ok);
  const failures = taskResults.filter((r) => !r.result.ok);
  const summaryLines = [];
  summaryLines.push(`✅ Successful tasks: ${successes.length}`);
  successes.forEach((r) => {
    summaryLines.push(`  - ${r.taskId} (worker: ${r.worker})`);
  });
  if (failures.length) {
    summaryLines.push(`❌ Failed tasks: ${failures.length}`);
    failures.forEach((r) => {
      const err = r.result.errorClass?.name || "Error";
      summaryLines.push(`  - ${r.taskId} (worker: ${r.worker}) → ${err}`);
    });
  }
  const report = summaryLines.join("\n");
  logger.info("=== Run Summary ===\n" + report);
  return report;
}
