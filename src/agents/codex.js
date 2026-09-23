// src/agents/codex.js
/**
 * Adapter for the Codex CLI worker.
 * Expected binary: `codex`
 */
import { BaseAdapter } from "./base-adapter.js";
import { execa } from "execa";
import { logger } from "../core/logger.js";
import { readFileSync } from "node:fs";

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
   * Uses `codex exec` which accepts the prompt as a positional argument.
   */
  buildCommand(task, opts) {
    const prompt = readFileSync(task.promptFile, "utf8");
    const args = ["exec"]; 
    if (task.model) args.push("--model", task.model);
    // No prompt argument; content will be passed via stdin by BaseAdapter.
    if (task.options && task.options.codexFlags) {
      args.push(...task.options.codexFlags);
    }
    return ["codex", ...args];
  }
}
