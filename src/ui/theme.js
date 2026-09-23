/**
 * @file src/ui/theme.js
 * Hacker-style color palette, formatting utilities, and status prefixes.
 */

import pc from 'picocolors';

export function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export const theme = {
  // Brand / matrix styling
  matrix: (text) => pc.green(pc.bold(text)),
  matrixDim: (text) => pc.dim(pc.green(text)),
  dim: (text) => pc.dim(text),
  bold: (text) => pc.bold(text),
  highlight: (text) => pc.cyan(pc.bold(text)),
  cyan: (text) => pc.cyan(text),
  warnText: (text) => pc.yellow(text),
  errorText: (text) => pc.red(text),
  successText: (text) => pc.green(text),
  okText: (text) => pc.green(text),

  // Status Prefixes
  okPrefix: pc.green(pc.bold('[ OK ]')),
  warnPrefix: pc.yellow(pc.bold('[WARN]')),
  failPrefix: pc.red(pc.bold('[FAIL]')),
  infoPrefix: pc.cyan(pc.bold('[INFO]')),
  failoverPrefix: pc.magenta(pc.bold('[FAILOVER]')),

  taskPrefix: (taskId) => pc.green(pc.bold(`[TASK ${taskId}]`)),
  workerTag: (workerId) => pc.cyan(`[${workerId}]`),

  // Borders & Dividers
  border: (text) => pc.dim(pc.green(text)),
  divider: (char = '─', length = 60) => pc.dim(char.repeat(length))
};
