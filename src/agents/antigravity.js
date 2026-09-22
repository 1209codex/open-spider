// src/agents/antigravity.js
/**
 * Adapter for the Antigravity CLI worker (`agy`).
 * Expected binary: `agy`
 */
import { BaseAdapter } from "./base-adapter.js";
import { execa } from "execa";
import { logger } from "../core/logger.js";

export class AntigravityAdapter extends BaseAdapter {
  static async detect() {
    try {
      await execa("agy", ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  static async version() {
    try {
      const { stdout } = await execa("agy", ["--version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Build command for a task.
   * Primary form: agy -p --prompt-file <file> [--model <model>]
   * If the binary fails to produce output (e.g., on non‑TTY terminals),
   * the manager may wrap it with `script -qec` – handled later by the manager.
   */
  buildCommand(task, opts) {
    const args = ["-p", "--prompt-file", task.promptFile];
    if (task.model) args.push("--model", task.model);
    if (task.options && task.options.antigravityFlags) {
      args.push(...task.options.antigravityFlags);
    }
    return ["agy", ...args];
  }
}
