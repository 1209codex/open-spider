// src/agents/codex.js
/**
 * Adapter for the Codex CLI worker.
 * Expected binary: `codex`
 */
import { BaseAdapter } from "./base-adapter.js";
import { execa } from "execa";
import { logger } from "../core/logger.js";

export class CodexAdapter extends BaseAdapter {
  static async detect() {
    try {
      await execa("codex", ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  static async version() {
    try {
      const { stdout } = await execa("codex", ["--version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Build the command line for a given task.
   * Simplified: codex run --prompt-file <file> [--model <model>]
   */
  buildCommand(task, opts) {
    const args = ["run", "--prompt-file", task.promptFile];
    if (task.model) args.push("--model", task.model);
    // Pass through any worker‑specific options.
    if (task.options && task.options.codexFlags) {
      args.push(...task.options.codexFlags);
    }
    return ["codex", ...args];
  }
}
