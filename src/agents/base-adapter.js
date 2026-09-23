// src/agents/base-adapter.js
/**
 * Abstract base class for worker adapters.
 * Each concrete worker must extend this class and implement the static methods.
 *
 * The manager will use the instance methods to run a task.
 *
 * @typedef {Object} Task
 * @property {string} id - Unique task identifier.
 * @property {string} title - Short description.
 * @property {string} promptFile - Path to a file containing the prompt for the worker.
 * @property {string} [model] - Model identifier (optional, passed via env or args).
 * @property {Object} [options] - Additional worker‑specific options.
 */

import { execa } from "execa";
import { logger } from "../core/logger.js";
import { WorkerError, QuotaError, AuthError, NetworkError } from "../core/errors.js";
import { getDataDir } from "../core/paths.js";
import { readFileSync } from "node:fs";
import { events } from "../core/events.js";

/**
 * Helper to kill a process tree on timeout.
 * execa's `killSignal` works for the child only, so we use a negative PID when possible.
 */
function killProcessTree(pid) {
  try {
    // On POSIX systems a negative pid kills the whole process group.
    process.kill(-pid, "SIGTERM");
  } catch (e) {
    // Fallback to direct kill.
    try {
      process.kill(pid, "SIGTERM");
    } catch (_) {}
  }
}

export class BaseAdapter {
  /**
   * Detect if the binary for this worker exists and is usable.
   * Should return a boolean.
   * @returns {Promise<boolean>}
   */
  static async detect() {
    return false; // abstract – override in subclass
  }

  /**
   * Return the version string of the worker binary.
   * @returns {Promise<string>}
   */
  static async version() {
    return "unknown";
  }

  /**
   * Optionally list models supported by the worker.
   * Default implementation returns [] – concrete workers can override.
   * @returns {Promise<Array<string>>}
   */
  static async listModels() {
    return [];
  }

  /**
   * Build the command line array to execute the worker for a given task.
   * Subclasses must override.
   * @param {Task} task
   * @param {Object} opts Additional runtime options (e.g., cwd).
   * @returns {Array<string>} command arguments (first element is binary)
   */
  buildCommand(task, opts) {
    throw new Error("buildCommand not implemented for this worker");
  }

  /**
   * Run a task using the worker.
   * Handles timeout, streaming logs, and error classification.
   * @param {Task} task
   * @param {Object} opts
   * @param {number} [opts.timeoutMs=20*60*1000] – default 20 minutes.
   * @returns {Promise<Object>} result object
   */
  async run(task, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 20 * 60 * 1000;
    const cmd = this.buildCommand(task, opts);
    const cwd = opts.cwd ?? process.cwd();
    logger.task(task.id, `Running ${cmd[0]} …`);
    const inputData = task.promptFile ? readFileSync(task.promptFile, "utf8") : undefined;
    const child = execa(cmd[0], cmd.slice(1), {
      cwd,
      timeout: timeoutMs,
      all: true,
      input: inputData,
    });

    // Forward output to logger and event stream in real‑time.
    if (child.all) {
      child.all.on("data", (chunk) => {
        const text = chunk.toString();
        logger.task(task.id, text);
        events.emitTaskOutput(opts.runId || '', task.id, task.worker || cmd[0], text);
      });
    }

    try {
      const { all } = await child;
      const output = all?.toString() ?? "";
      return {
        ok: true,
        exitCode: child.exitCode,
        output,
        errorClass: null,
        raw: child,
      };
    } catch (err) {
      // On timeout execa throws a CancelError with signal property.
      const stdout = err.stdout?.toString() ?? "";
      const stderr = err.stderr?.toString() ?? "";
      const errorClass = this.classifyError(stderr, stdout, err.exitCode);
      // Ensure the whole process tree is killed.
      if (err.pid) killProcessTree(err.pid);
      return {
        ok: false,
        exitCode: err.exitCode ?? null,
        output: stdout + "\n" + stderr,
        errorClass,
        raw: err,
      };
    }
  }

  /**
   * Map raw stderr/stdout patterns to typed error classes.
   * Subclasses can extend this method.
   * @param {string} stderr
   * @param {string} stdout
   * @param {number|null} exitCode
   * @returns {typeof WorkerError}
   */
  classifyError(stderr, stdout, exitCode) {
    const combined = `${stderr}\n${stdout}`.toLowerCase();
    if (combined.includes("quota") || combined.includes("rate limit")) {
      return QuotaError;
    }
    if (combined.includes("auth") || combined.includes("unauthorized")) {
      return AuthError;
    }
    if (combined.includes("timeout") || exitCode === 124) {
      return NetworkError;
    }
    // Fallback generic worker error.
    return WorkerError;
  }
}
