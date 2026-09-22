/**
 * @file src/ui/banner.js
 * Responsive hacker-style ASCII spider banner with status line and mobile support.
 */

import { theme } from './theme.js';

export function getTerminalWidth() {
  return process.stdout.columns || 80;
}

/**
 * Returns formatted banner string adapted to terminal width.
 * @param {object} [status]
 * @param {string} [status.version='0.1.0']
 * @param {string} [status.manager='google/gemini-2.5-flash']
 * @param {string} [status.workers='4/4 online']
 * @param {string|number} [status.mcp=0]
 * @returns {string}
 */
export function renderBanner(status = {}) {
  const width = getTerminalWidth();
  const v = status.version || '0.1.0';
  const mgr = status.manager || 'openrouter';
  const wrk = status.workers || '0 online';
  const mcpCount = status.mcp !== undefined ? status.mcp : 0;

  if (width < 60) {
    // Compact mobile banner for ~50 columns
    const lines = [
      theme.matrix('/\\(o_o)/\\  OPEN-SPIDER v' + v),
      theme.dim(`mgr: ${mgr} | workers: ${wrk} | mcp: ${mcpCount}`),
      theme.divider('─', Math.min(width, 48))
    ];
    return lines.join('\n');
  }

  // Full hacker banner
  const art = [
    '  ___                     ___       _     _           ',
    ' / _ \\ _ __   ___ _ __   / __|_ __ (_) __| |___ _ _   ',
    '| (_) | \'_ \\ / -_) \'  \\  \\__ \\ \'_ \\| |/ _` / -_) \'_|  ',
    ' \\___/| .__/ \\___|_|_|_| |___/ .__/|_|\\__,_\\___|_|    ',
    '      |_|                    |_|                      '
  ];

  const styledArt = art.map((line) => theme.matrix(line)).join('\n');
  const tagLine = theme.matrix(`=== OPEN-SPIDER v${v} ===`);
  const statusLine = theme.dim(`manager: `) + theme.highlight(mgr) +
    theme.dim(` | workers: `) + theme.highlight(wrk) +
    theme.dim(` | mcp: `) + theme.highlight(String(mcpCount));

  return `${styledArt}\n${tagLine}\n${statusLine}\n`;
}

/**
 * Optional boot animation when interactive TTY is available.
 * @param {boolean} [animate=true]
 */
export async function showBootAnimation(animate = true) {
  const isTTY = process.stdout.isTTY && !process.env.NO_COLOR && animate;
  if (!isTTY) {
    console.log(renderBanner());
    return;
  }

  const banner = renderBanner();
  console.log(banner);
}
