/**
 * @file src/ui/box.js
 * Terminal box and panel renderer supporting mobile width constraints.
 */

import { theme, stripAnsi } from './theme.js';
import { getTerminalWidth } from './banner.js';

/**
 * Creates a formatted ASCII box around text content.
 * @param {string|string[]} content
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {number} [options.width]
 * @param {string} [options.borderColor='border']
 * @returns {string}
 */
export function renderBox(content, options = {}) {
  const terminalWidth = getTerminalWidth();
  const maxAllowedWidth = Math.max(30, terminalWidth - 2);
  const targetWidth = Math.min(options.width || 76, maxAllowedWidth);
  const innerWidth = targetWidth - 4; // 2 border chars + 2 padding spaces

  const rawLines = Array.isArray(content) ? content : String(content).split('\n');
  const wrappedLines = [];

  for (const line of rawLines) {
    if (stripAnsi(line).length <= innerWidth) {
      wrappedLines.push(line);
    } else {
      // Wrap long line
      let remaining = line;
      while (remaining.length > 0) {
        wrappedLines.push(remaining.substring(0, innerWidth));
        remaining = remaining.substring(innerWidth);
      }
    }
  }

  const border = theme.border;
  const topBorder = options.title
    ? `┌─ ${theme.matrix(options.title)} ${'─'.repeat(Math.max(0, innerWidth - stripAnsi(options.title).length - 1))}┐`
    : `┌${'─'.repeat(innerWidth + 2)}┐`;

  const bottomBorder = `└${'─'.repeat(innerWidth + 2)}┘`;

  const middleLines = wrappedLines.map((line) => {
    const visibleLen = stripAnsi(line).length;
    const padding = ' '.repeat(Math.max(0, innerWidth - visibleLen));
    return `${border('│')} ${line}${padding} ${border('│')}`;
  });

  return [border(topBorder), ...middleLines, border(bottomBorder)].join('\n');
}
