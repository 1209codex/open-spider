// src/agents/hermes.js
/**
 * Adapter for the Hermes CLI worker.
 * Expected binary: `hermes`
 */
import { BaseAdapter } from "./base-adapter.js";
import { execa } from "execa";
import { logger } from "../core/logger.js";

export class HermesAdapter extends BaseAdapter {
  static async detect() {
    try {
      await execa("hermes", ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  static async version() {
    try {
      const { stdout } = await execa("hermes", ["--version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Build command for a task.
   * Simplified: hermes chat -q --prompt-file <file> [--model <model>]
   */
  buildCommand(task, opts) {
    const args = ["chat", "-q", "--prompt-file", task.promptFile];
    if (task.model) args.push("--model", task.model);
    if (task.options && task.options.hermesFlags) {
      args.push(...task.options.hermesFlags);
    }
    return ["hermes", ...args];
  }
}
