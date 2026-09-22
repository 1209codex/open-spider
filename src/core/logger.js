/**
 * @file src/core/logger.js
 * Structured logging and live stream tailing for Open-spider.
 */

import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { theme } from '../ui/theme.js';

class Logger {
  constructor() {
    this.debugMode = false;
    this.activeLogFile = null;
  }

  setDebug(enabled) {
    this.debugMode = !!enabled;
  }

  setActiveLogFile(filePath) {
    this.activeLogFile = filePath;
    if (filePath) {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  _writeToFile(line) {
    if (this.activeLogFile) {
      try {
        const clean = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
        appendFileSync(this.activeLogFile, `${new Date().toISOString()} ${clean}\n`, 'utf8');
      } catch {
        // Ignore file append errors
      }
    }
  }

  ok(msg) {
    const text = `${theme.okPrefix} ${msg}`;
    console.log(text);
    this._writeToFile(`[ OK ] ${msg}`);
  }

  warn(msg) {
    const text = `${theme.warnPrefix} ${msg}`;
    console.warn(text);
    this._writeToFile(`[WARN] ${msg}`);
  }

  fail(msg) {
    const text = `${theme.failPrefix} ${msg}`;
    console.error(text);
    this._writeToFile(`[FAIL] ${msg}`);
  }

  info(msg) {
    const text = `${theme.infoPrefix} ${msg}`;
    console.log(text);
    this._writeToFile(`[INFO] ${msg}`);
  }

  failover(fromWorker, toWorker, reason) {
    const text = `${theme.failoverPrefix} ${theme.highlight(fromWorker)} -> ${theme.highlight(toWorker)} (reason: ${reason})`;
    console.log(text);
    this._writeToFile(`[FAILOVER] ${fromWorker} -> ${toWorker} (reason: ${reason})`);
  }

  task(taskId, msg, workerId = '') {
    const prefix = theme.taskPrefix(taskId);
    const workerTag = workerId ? ` [${workerId}]` : '';
    const text = `${prefix}${workerTag} ${msg}`;
    console.log(text);
    this._writeToFile(`[TASK ${taskId}]${workerTag} ${msg}`);
  }

  debug(msg) {
    if (this.debugMode) {
      const text = `${theme.dim('[DEBUG]')} ${msg}`;
      console.log(text);
      this._writeToFile(`[DEBUG] ${msg}`);
    }
  }

  raw(msg) {
    console.log(msg);
    this._writeToFile(msg);
  }
}

export const logger = new Logger();
