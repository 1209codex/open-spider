/**
 * @file src/data/providers.catalog.js
 * Master catalog of LLM API providers ordered strictly FREE first, then PAID.
 */

export const PROVIDERS_CATALOG = [
  // --- FREE TIER PROVIDERS (Listed First) ---
  {
    id: 'openrouter',
    name: 'OpenRouter (Free & Paid Models)',
    baseUrl: 'https://openrouter.ai/api/v1',
    type: 'openai-compatible',
    envKey: 'OPENROUTER_API_KEY',
    free: true,
    freeNote: 'Models ending with :free or pricing 0 are 100% free',
    modelsPath: '/models',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    curatedModels: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', free: true },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', free: true },
      { id: 'mistralai/mistral-small-24b-instruct-2501:free', name: 'Mistral Small 24B (Free)', free: true },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Paid)', free: false },
      { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet (Paid)', free: false }
    ]
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    type: 'openai-compatible',
    envKey: 'GROQ_API_KEY',
    free: true,
    freeNote: 'Ultra-fast inference free tier with generous limits',
    modelsPath: '/models',
    defaultModel: 'llama-3.3-70b-versatile',
    curatedModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', free: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', free: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', free: true }
    ]
  },
  {
    id: 'cerebras',
    name: 'Cerebras AI',
    baseUrl: 'https://api.cerebras.ai/v1',
    type: 'openai-compatible',
    envKey: 'CEREBRAS_API_KEY',
    free: true,
    freeNote: 'Ultra-fast wafer-scale free tier',
    modelsPath: '/models',
    defaultModel: 'llama3.3-70b',
    curatedModels: [
      { id: 'llama3.3-70b', name: 'Llama 3.3 70B', free: true },
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B', free: true }
    ]
  },
  {
    id: 'google-ai-studio',
    name: 'Google AI Studio (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    type: 'openai-compatible',
    envKey: 'GEMINI_API_KEY',
    free: true,
    freeNote: 'Free tier with rate limits (15 RPM / 1M TPM)',
    modelsPath: '/models',
    defaultModel: 'gemini-2.0-flash',
    curatedModels: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', free: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', free: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', free: true }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI (La Plateforme)',
    baseUrl: 'https://api.mistral.ai/v1',
    type: 'openai-compatible',
    envKey: 'MISTRAL_API_KEY',
    free: true,
    freeNote: 'Free experiment tier available',
    modelsPath: '/models',
    defaultModel: 'mistral-small-latest',
    curatedModels: [
      { id: 'mistral-small-latest', name: 'Mistral Small Latest', free: true },
      { id: 'codestral-latest', name: 'Codestral (Code)', free: true },
      { id: 'mistral-large-latest', name: 'Mistral Large (Paid)', free: false }
    ]
  },
  {
    id: 'nvidia-nim',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    type: 'openai-compatible',
    envKey: 'NVIDIA_API_KEY',
    free: true,
    freeNote: 'Free trial credits (1000 requests)',
    modelsPath: '/models',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    curatedModels: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', free: true },
      { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', free: true }
    ]
  },
  {
    id: 'github-models',
    name: 'GitHub Models',
    baseUrl: 'https://models.github.ai/inference',
    type: 'openai-compatible',
    envKey: 'GITHUB_TOKEN',
    free: true,
    freeNote: 'Free tier for personal GitHub accounts',
    modelsPath: '/models',
    defaultModel: 'gpt-4o-mini',
    curatedModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', free: true },
      { id: 'meta-llama-3.1-70b-instruct', name: 'Llama 3.1 70B', free: true }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (Local Inference)',
    baseUrl: 'http://localhost:11434/v1',
    type: 'openai-compatible',
    envKey: '',
    free: true,
    freeNote: '100% Free & Local, no API key required',
    modelsPath: '/models',
    defaultModel: 'llama3.2',
    curatedModels: [
      { id: 'llama3.2', name: 'Llama 3.2 (Local)', free: true },
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B (Local)', free: true }
    ]
  },

  // --- PAID PROVIDERS (Listed Second) ---
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    type: 'openai-compatible',
    envKey: 'OPENAI_API_KEY',
    free: false,
    freeNote: 'Commercial / Paid credits',
    modelsPath: '/models',
    defaultModel: 'gpt-4o-mini',
    curatedModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', free: false },
      { id: 'gpt-4o', name: 'GPT-4o', free: false },
      { id: 'o3-mini', name: 'o3 Mini', free: false }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    baseUrl: 'https://api.deepseek.com/v1',
    type: 'openai-compatible',
    envKey: 'DEEPSEEK_API_KEY',
    free: false,
    freeNote: 'Extremely affordable pricing per token',
    modelsPath: '/models',
    defaultModel: 'deepseek-chat',
    curatedModels: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', free: false },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', free: false }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    type: 'openai-compatible',
    envKey: 'ANTHROPIC_API_KEY',
    free: false,
    freeNote: 'Paid API',
    modelsPath: '/models',
    defaultModel: 'claude-3-5-haiku-20241022',
    curatedModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', free: false },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', free: false }
    ]
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    type: 'openai-compatible',
    envKey: 'XAI_API_KEY',
    free: false,
    freeNote: 'Paid API',
    modelsPath: '/models',
    defaultModel: 'grok-2-latest',
    curatedModels: [
      { id: 'grok-2-latest', name: 'Grok 2 Latest', free: false }
    ]
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    type: 'openai-compatible',
    envKey: 'TOGETHER_API_KEY',
    free: false,
    freeNote: 'Paid API ($5 initial credits for new users)',
    modelsPath: '/models',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    curatedModels: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', free: false },
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', free: false }
    ]
  }
];

/**
 * Returns provider definition by ID from catalog or custom config.
 * @param {string} providerId
 * @param {Array} [customProviders=[]]
 * @returns {object|undefined}
 */
export function findProvider(providerId, customProviders = []) {
  return PROVIDERS_CATALOG.find((p) => p.id === providerId) ||
    customProviders.find((p) => p.id === providerId);
}
