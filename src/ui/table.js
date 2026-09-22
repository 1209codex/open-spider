/**
 * @file src/ui/table.js
 * Terminal table renderer with column alignment and mobile width truncation.
 */

import { theme, stripAnsi } from './theme.js';
import { getTerminalWidth } from './banner.js';

/**
 * Formats a table of rows.
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {object} [options]
 * @param {number[]} [options.colWidths]
 * @returns {string}
 */
export function renderTable(headers, rows, options = {}) {
  const terminalWidth = getTerminalWidth();
  const numCols = headers.length;

  // Calculate maximum visible length for each column
  const calculatedWidths = headers.map((h, i) => {
    let max = stripAnsi(h).length;
    for (const row of rows) {
      const cell = row[i] ? stripAnsi(String(row[i])) : '';
      if (cell.length > max) max = cell.length;
    }
    return max;
  });

  const colWidths = options.colWidths || calculatedWidths;

  // Ensure total table width does not exceed terminal
  const paddingPerCol = 2;
  const totalRawWidth = colWidths.reduce((acc, w) => acc + w + paddingPerCol, 0);

  let finalWidths = [...colWidths];
  if (totalRawWidth > terminalWidth && numCols > 1) {
    const scaleFactor = (terminalWidth - (paddingPerCol * numCols)) / (totalRawWidth - (paddingPerCol * numCols));
    finalWidths = colWidths.map((w) => Math.max(6, Math.floor(w * scaleFactor)));
  }

  const formatRow = (cells, isHeader = false) => {
    return cells
      .map((cell, i) => {
        const str = cell !== undefined && cell !== null ? String(cell) : '';
        const visible = stripAnsi(str);
        const width = finalWidths[i] || 10;
        let content = str;

        if (visible.length > width) {
          content = visible.substring(0, width - 1) + '…';
        }

        const pad = ' '.repeat(Math.max(0, width - stripAnsi(content).length));
        const formattedCell = `${content}${pad}`;
        return isHeader ? theme.matrix(formattedCell) : formattedCell;
      })
      .join('  ');
  };

  const headerLine = formatRow(headers, true);
  const dividerLine = theme.dim('─'.repeat(Math.min(terminalWidth, stripAnsi(headerLine).length + 2)));
  const dataLines = rows.map((r) => formatRow(r, false));

  return [headerLine, dividerLine, ...dataLines].join('\n');
}
