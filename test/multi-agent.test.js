// test/multi-agent.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { routeTasks } from '../src/manager/router.js';
import { runTasks } from '../src/manager/scheduler.js';
import { getWorkersStatus, setWorkerWorking, setWorkerIdle } from '../src/agents/health.js';
import { handleAgentsCommand } from '../src/cli/agents.js';
import { loadConfig, setConfigValue } from '../src/core/config.js';

describe('Multi-Agent Company Orchestration & Worker Status', () => {
  test('Live worker status tracks idle and working states', async () => {
    let workers = await getWorkersStatus();
    let codex = workers.find(w => w.id === 'codex');
    assert.equal(codex.status, 'idle');
    assert.equal(codex.currentTask, null);

    // Simulate task running on codex
    setWorkerWorking('codex', { id: 'task-1', title: 'Refactor DB schema' });
    workers = await getWorkersStatus();
    codex = workers.find(w => w.id === 'codex');
    assert.equal(codex.status, 'working');
    assert.equal(codex.currentTask?.taskId, 'task-1');

    // Return to idle
    setWorkerIdle('codex');
    workers = await getWorkersStatus();
    codex = workers.find(w => w.id === 'codex');
    assert.equal(codex.status, 'idle');
  });

  test('Per-worker model assignment via CLI and config', async () => {
    await handleAgentsCommand('model', 'codex', 'gpt-4o');
    const config = loadConfig();
    assert.equal(config.workers?.codex?.model, 'gpt-4o');

    // Router attaches configured model to routed task
    const mockPlan = {
      summary: 'Build feature',
      tasks: [
        { id: 't1', title: 'Write backend', kind: 'backend', suggested_worker: 'codex' }
      ]
    };

    const routed = await routeTasks(mockPlan, 'free-first');
    assert.equal(routed.length, 1);
    assert.equal(routed[0].worker, 'codex');
    assert.equal(routed[0].model, 'gpt-4o');
  });

  test('Scheduler executes tasks and collects collaborative results', async () => {
    const tasks = [
      { id: 't1', title: 'Phase 1 Init', instructions: 'Generate template', worker: 'custom', options: {} }
    ];

    // Setup custom adapter template to run echo
    const { CustomAdapter } = await import('../src/agents/custom.js');
    CustomAdapter.template = ['node', '-e', 'console.log("Team Task Output: Success")'];

    const results = await runTasks(tasks);
    assert.equal(results.length, 1);
    assert.equal(results[0].taskId, 't1');
    assert.equal(results[0].worker, 'custom');
    assert.equal(results[0].result.ok, true);
    assert.match(results[0].result.output, /Team Task Output: Success/);
  });
});
