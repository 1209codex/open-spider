// src/agents/index.js
/**
 * Export a mapping of worker IDs to their adapter classes.
 * Used by the manager runtime to instantiate the appropriate adapter.
 */
import { CodexAdapter } from "./codex.js";
import { OpencodeAdapter } from "./opencode.js";
import { HermesAdapter } from "./hermes.js";
import { AntigravityAdapter } from "./antigravity.js";
import { CustomAdapter } from "./custom.js";

export const adapters = {
  codex: CodexAdapter,
  opencode: OpencodeAdapter,
  hermes: HermesAdapter,
  antigravity: AntigravityAdapter,
  custom: CustomAdapter,
};
