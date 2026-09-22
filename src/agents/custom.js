// src/agents/custom.js
/**
 * Adapter for a custom worker defined by a command template.
 * The template may contain placeholders that are interpolated at runtime.
 *
 * Placeholders (case‑sensitive) supported:
 *   {promptFile} – absolute path to the prompt file for the task
 *   {cwd}        – working directory for the task
 *   {model}      – model identifier (if provided)
 *   {extra}      – any extra string passed via task.options.customExtra
 */
import { BaseAdapter } from "./base-adapter.js";
import { logger } from "../core/logger.js";
import { promises as fs } from "node:fs";

export class CustomAdapter extends BaseAdapter {
  /**
   * The command template is stored in the static property `template`.
   * It should be an array where the first element is the binary and the rest are args.
   * Example: ["mycli", "--task", "{promptFile}", "--model", "{model}"]
   */
  static template = [];

  static async detect() {
    if (!this.template.length) return false;
    const binary = this.template[0];
    try {
      // Simple existence check – try running --help.
      const { execa } = await import("execa");
      await execa(binary, ["--help"]);
      return true;
    } catch {
      return false;
    }
  }

  static async version() {
    if (!this.template.length) return "unknown";
    const binary = this.template[0];
    try {
      const { execa } = await import("execa");
      const { stdout } = await execa(binary, ["--version"]);
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Build the concrete command by interpolating placeholders.
   */
  buildCommand(task, opts) {
    if (!this.constructor.template.length) {
      throw new Error("CustomAdapter template not set");
    }
    const mapping = {
      "{promptFile}": task.promptFile || "",
      "{cwd}": opts.cwd || process.cwd(),
      "{model}": task.model || "",
      "{extra}": task.options?.customExtra || "",
    };
    const interpolated = this.constructor.template.map((part) => {
      let out = part;
      for (const [ph, val] of Object.entries(mapping)) {
        out = out.replace(new RegExp(ph, "g"), val);
      }
      return out;
    });
    return interpolated;
  }
}
