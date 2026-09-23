// src/data/agent-profiles.js
/**
 * Default agent profiles and capability heuristics.
 * Represents company employees / worker roles for Open-Spider orchestration.
 */

/**
 * @typedef {Object} ModelOption
 * @property {string} id
 * @property {string} name
 * @property {boolean} free
 * @property {string} provider
 */

/**
 * @typedef {Object} AgentProfile
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} description
 * @property {string[]} tags
 * @property {string} defaultModel
 * @property {ModelOption[]} recommendedModels
 */

/** @type {Record<string, AgentProfile>} */
export const AGENT_PROFILES = {
  codex: {
    id: "codex",
    name: "Codex CLI",
    role: "Backend, Testing & Logic Engineer",
    description: "Specialized in backend algorithms, comprehensive tests, refactoring, and code review.",
    tags: ["backend", "refactor", "debug", "tests", "review"],
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    recommendedModels: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", free: true, provider: "openrouter" },
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", free: true, provider: "openrouter" },
      { id: "qwen/qwen-2.5-coder-32b-instruct:free", name: "Qwen 2.5 Coder 32B", free: true, provider: "openrouter" },
      { id: "gpt-4o", name: "GPT-4o (OpenAI)", free: false, provider: "openai" },
      { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", free: false, provider: "openrouter" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3", free: false, provider: "deepseek" }
    ]
  },
  opencode: {
    id: "opencode",
    name: "OpenCode CLI",
    role: "Fullstack & DevOps Specialist",
    description: "Versatile employee for rapid script execution, devops pipelines, and free-model workflows.",
    tags: ["general", "devops", "backend", "quick-edits", "free-tier"],
    defaultModel: "google/gemini-2.0-flash-exp:free",
    recommendedModels: [
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", free: true, provider: "openrouter" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", free: true, provider: "openrouter" },
      { id: "mistralai/mistral-small-24b-instruct-2501:free", name: "Mistral Small 24B", free: true, provider: "openrouter" },
      { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", free: false, provider: "anthropic" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3", free: false, provider: "deepseek" }
    ]
  },
  hermes: {
    id: "hermes",
    name: "Hermes Agent",
    role: "Research, Automation & Multi-Tool Agent",
    description: "Autonomous agent adept at research, documentation, complex automation, and deep tool calling.",
    tags: ["research", "docs", "automation", "multi-tool", "scripting"],
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    recommendedModels: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", free: true, provider: "openrouter" },
      { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1", free: true, provider: "openrouter" },
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", free: true, provider: "openrouter" },
      { id: "deepseek/deepseek-reasoner", name: "DeepSeek Reasoner R1", free: false, provider: "deepseek" },
      { id: "mistralai/mistral-large-latest", name: "Mistral Large", free: false, provider: "mistral" },
      { id: "gpt-4o", name: "GPT-4o (OpenAI)", free: false, provider: "openai" }
    ]
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity CLI (agy)",
    role: "Frontend, UI/UX & Architecture Lead",
    description: "Excels at UI/UX design, frontend components, multi-file refactors, and structural planning.",
    tags: ["frontend", "ui", "ux", "multi-file", "planning"],
    defaultModel: "google/gemini-2.0-flash-exp:free",
    recommendedModels: [
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", free: true, provider: "openrouter" },
      { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", free: true, provider: "google-ai-studio" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", free: true, provider: "openrouter" },
      { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", free: false, provider: "anthropic" },
      { id: "gpt-4o", name: "GPT-4o (OpenAI)", free: false, provider: "openai" }
    ]
  },
  custom: {
    id: "custom",
    name: "Custom Agent Template",
    role: "External Command & Custom Script Runner",
    description: "User-defined CLI or script template execution for specialized workflows.",
    tags: ["other", "custom", "scripts"],
    defaultModel: "",
    recommendedModels: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", free: true, provider: "openrouter" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", free: true, provider: "github-models" },
      { id: "gpt-4o", name: "GPT-4o", free: false, provider: "openai" }
    ]
  }
};
