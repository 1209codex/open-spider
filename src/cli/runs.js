/**
 * @file src/cli/runs.js
 * CLI command handler for managing execution history (list | show | resume).
 */

import { listRuns, getRunState } from '../core/run-state.js';
import { renderTable } from '../ui/table.js';
import { theme } from '../ui/theme.js';
import { logger } from '../core/logger.js';
import { formatError } from '../core/errors.js';
import { handleRunCommand } from './run.js';

export async function handleRunsCommand(action = 'list', runId = null, options = {}) {
  switch (action) {
    case 'list': {
      const runs = listRuns(options.limit || 20);
      if (runs.length === 0) {
        logger.info('No past execution runs found in ~/.open-spider/runs/');
        return;
      }
      const headers = ['Run ID', 'Goal', 'Status', 'Created At'];
      const rows = runs.map((r) => [
        theme.cyan(r.id),
        (r.goal || '').length > 40 ? `${(r.goal || '').slice(0, 37)}...` : (r.goal || ''),
        r.status === 'completed' ? theme.okText(r.status) : theme.failText(r.status || 'unknown'),
        theme.dim(new Date(r.createdAt).toLocaleString())
      ]);
      console.log(theme.matrix('\n=== OPEN-SPIDER RUN HISTORY ===\n'));
      console.log(renderTable(headers, rows));
      console.log('');
      break;
    }

    case 'show': {
      if (!runId) {
        logger.error('Usage: open-spider runs show <runId>');
        return;
      }
      const state = getRunState(runId);
      if (!state) {
        logger.fail(`Run "${runId}" not found.`);
        return;
      }
      console.log(theme.matrix(`\n=== RUN DETAILS: ${state.id} ===\n`));
      console.log(`${theme.dim('Goal:')} ${theme.highlight(state.goal || 'N/A')}`);
      console.log(`${theme.dim('Status:')} ${state.status}`);
      console.log(`${theme.dim('Created:')} ${state.createdAt}`);
      if (state.plan) {
        console.log(`\n${theme.dim('Plan Summary:')} ${state.plan.summary || ''}`);
        if (state.plan.tasks) {
          state.plan.tasks.forEach((t) => {
            console.log(`  - [${t.id}] ${t.title} (worker: ${t.suggested_worker || t.worker || 'auto'})`);
          });
        }
      }
      if (state.summary) {
        console.log(`\n${theme.dim('Results:')}\n${state.summary}`);
      }
      console.log('');
      break;
    }

    case 'resume': {
      if (!runId) {
        logger.error('Usage: open-spider runs resume <runId>');
        return;
      }
      const state = getRunState(runId);
      if (!state) {
        logger.fail(`Run "${runId}" not found to resume.`);
        return;
      }
      logger.info(`Resuming run ${runId} with goal: "${state.goal}"`);
      await handleRunCommand(state.goal, state.options || {});
      break;
    }

    default:
      logger.warn(`Unknown action "${action}". Available: list, show, resume`);
  }
}
