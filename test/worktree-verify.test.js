// test/worktree-verify.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isGitRepo, getCurrentBranch } from '../src/core/worktree.js';
import { handleRunCommand } from '../src/cli/run.js';
import { CustomAdapter } from '../src/agents/custom.js';

describe('Worktree Isolation & Post-Run Verification', () => {
  test('isGitRepo detects git repository correctly', async () => {
    const isGit = await isGitRepo();
    assert.equal(isGit, true);

    const branch = await getCurrentBranch();
    assert.ok(typeof branch === 'string' && branch.length > 0);
  });

  test('handleRunCommand runs task and executes verification command', async () => {
    CustomAdapter.template = ['node', '-e', 'console.log("Verified Task Run")'];

    const res = await handleRunCommand('Test task with verification', {
      worker: 'custom',
      verify: 'node -e "console.log(\'Verification check passed\')"'
    });

    assert.equal(res.results.length, 1);
    assert.match(res.report, /Verification/);
    assert.match(res.report, /PASSED/);
    assert.match(res.report, /Verification check passed/);
  });
});
