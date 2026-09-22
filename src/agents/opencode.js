// src/agents/opencode.js
/**
 * Adapter for the OpenCode CLI worker.
 * Expected binary: `opencode`
 */
import { BaseAdapter } from "./base-adapter.js";
import { execa } from "execa";
import { logger } from "../core/logger.js";

export class OpencodeAdapter extends BaseAdapter {
  static async detect() {
    try {
      await execa("opencode", ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  static async version() {
    try {
      const { stdout } = await execa("opencode", ["--version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Build command for a task.
   * Simplified: opencode run --prompt-file <file> [--model <model>]
   */
  buildCommand(task, opts) {
    const args = ["run", "--prompt-file", task.promptFile];
    if (task.model) args.push("--model", task.model);
    if (task.options && task.options.opencodeFlags) {
      args.push(...task.options.opencodeFlags);
    }
    return ["opencode", ...args];
  }
}
