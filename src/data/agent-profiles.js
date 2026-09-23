// src/data/agent-profiles.js
/**
 * Default agent profiles and capability heuristics.
 * Represents company employees / worker roles for Open-Spider orchestration.
 */

/**
 * @typedef {Object} AgentProfile
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} description
 * @property {string[]} tags
 * @property {string} defaultModel
 * @property {string[]} recommendedModels
 */

/** @type {Record<string, AgentProfile>} */
export const AGENT_PROFILES = {
  codex: {
    id: "codex",
    name: "Codex CLI",
    role: "Backend, Testing & Logic Engineer",
    description: "Specialized in backend algorithms, comprehensive tests, refactoring, and code review.",
    tags: ["backend", "refactor", "debug", "tests", "review"],
    defaultModel: "gpt-4o",
    recommendedModels: ["gpt-4o", "o1", "claude-3-5-sonnet", "deepseek-coder"]
  },
  opencode: {
    id: "opencode",
    name: "OpenCode CLI",
    role: "Fullstack & DevOps Specialist",
    description: "Versatile employee for rapid script execution, devops pipelines, and free-model workflows.",
    tags: ["general", "devops", "backend", "quick-edits", "free-tier"],
    defaultModel: "anthropic/claude-3-5-sonnet",
    recommendedModels: ["anthropic/claude-3-5-sonnet", "meta-llama/llama-3.3-70b-instruct", "google/gemini-2.5-flash", "deepseek/deepseek-chat"]
  },
  hermes: {
    id: "hermes",
    name: "Hermes Agent",
    role: "Research, Automation & Multi-Tool Agent",
    description: "Autonomous agent adept at research, documentation, complex automation, and deep tool calling.",
    tags: ["research", "docs", "automation", "multi-tool", "scripting"],
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    recommendedModels: ["meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-r1", "openai/gpt-4o", "mistralai/mistral-large"]
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity CLI (agy)",
    role: "Frontend, UI/UX & Architecture Lead",
    description: "Excels at UI/UX design, frontend components, multi-file refactors, and structural planning.",
    tags: ["frontend", "ui", "ux", "multi-file", "planning"],
    defaultModel: "google/gemini-2.5-pro",
    recommendedModels: ["google/gemini-2.5-pro", "claude-3-5-sonnet", "gpt-4o", "google/gemini-2.5-flash"]
  },
  custom: {
    id: "custom",
    name: "Custom Agent Template",
    role: "External Command & Custom Script Runner",
    description: "User-defined CLI or script template execution for specialized workflows.",
    tags: ["other", "custom", "scripts"],
    defaultModel: "",
    recommendedModels: []
  }
};
