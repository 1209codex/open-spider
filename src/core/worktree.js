// src/core/worktree.js
/**
 * Git Worktree Isolation Manager for Open-Spider write tasks.
 * Creates dedicated branches & worktrees per task to safely parallelize filesystem changes.
 */

import { execa } from 'execa';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getRunDir } from './paths.js';
import { logger } from './logger.js';

export async function isGitRepo(cwd = process.cwd()) {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

export async function getCurrentBranch(cwd = process.cwd()) {
  try {
    const { stdout } = await execa('git', ['branch', '--show-current'], { cwd });
    return stdout.trim() || 'HEAD';
  } catch {
    return 'main';
  }
}

/**
 * Creates an isolated git worktree on branch spider/<runId>/<taskId>.
 */
export async function createWorktree(runId, taskId, cwd = process.cwd()) {
  const isGit = await isGitRepo(cwd);
  if (!isGit) return null;

  const branchName = `spider/${runId}/${taskId}`;
  const worktreeDir = join(getRunDir(runId), 'worktrees', taskId);

  try {
    mkdirSync(join(getRunDir(runId), 'worktrees'), { recursive: true });
    // Create new branch and worktree directory
    await execa('git', ['worktree', 'add', '-b', branchName, worktreeDir], { cwd });
    logger.info(`Created isolated git worktree at ${worktreeDir} (branch ${branchName})`);
    return { worktreeDir, branchName };
  } catch (err) {
    logger.warn(`Failed to create worktree for task ${taskId}: ${err.message}. Running in main working directory.`);
    return null;
  }
}

/**
 * Merges the completed task worktree branch back into the target branch.
 */
export async function mergeWorktree(runId, taskId, branchName, cwd = process.cwd()) {
  if (!branchName) return { ok: true };
  try {
    logger.info(`Merging task branch ${branchName}...`);
    await execa('git', ['merge', '--no-ff', '-m', `Merge completed task ${taskId} from ${branchName}`, branchName], { cwd });
    logger.ok(`Merged task branch ${branchName} successfully`);
    return { ok: true };
  } catch (err) {
    logger.fail(`Merge conflict or error on branch ${branchName}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

/**
 * Cleans up the worktree and branch.
 */
export async function cleanupWorktree(runId, taskId, branchName, worktreeDir, cwd = process.cwd()) {
  try {
    if (worktreeDir && existsSync(worktreeDir)) {
      await execa('git', ['worktree', 'remove', '--force', worktreeDir], { cwd }).catch(() => {});
      rmSync(worktreeDir, { recursive: true, force: true });
    }
    if (branchName) {
      await execa('git', ['branch', '-D', branchName], { cwd }).catch(() => {});
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}
