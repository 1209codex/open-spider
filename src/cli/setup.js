// src/cli/setup.js
/**
 * Setup wizard for Open‑Spider.
 * Provides an interactive flow (or a fast "quick" mode) to configure:
 *   • Data directory (OPEN_SPIDER_HOME)
 *   • LLM provider and API key (secret stored securely)
 *   • Default model for the manager
 * After collecting inputs it persists them to the config files and runs a
 * quick health‑check (`doctor --deep`).
 */
import { logger } from '../core/logger.js';
import { formatError } from '../core/errors.js';
import { loadConfig, saveConfig, setConfigValue } from '../core/config.js';
import { setSecret } from '../core/secrets.js';
import { getAllProviders } from '../providers/providers-store.js';
import { listModelsForProvider } from '../providers/model-list.js';
import { runDoctor } from './doctor.js';
import * as prompts from '@clack/prompts';

export async function handleSetupWizard(options) {
  try {
    logger.info('Starting Open‑Spider setup wizard...');

    // ---------------------------
    // 1️⃣ Data directory (OPEN_SPIDER_HOME)
    // ---------------------------
    const defaultDir = `${process.env.HOME}/.open-spider`;
    const dataDir = options.quick
      ? defaultDir
      : await prompts.text({
          message: 'Data directory (OPEN_SPIDER_HOME)',
          defaultValue: defaultDir,
        });
    // Store in config (the config module will read env var at runtime, but we persist for clarity)
    setConfigValue('dataDir', dataDir);

    // ---------------------------
    // 2️⃣ Provider selection (free providers first)
    // ---------------------------
    const freeProviders = getAllProviders().filter((p) => p.free);
    const providerChoice = options.quick
      ? freeProviders[0]?.id || ''
      : await prompts.select({
          message: 'Select a free LLM provider',
          options: freeProviders.map((p) => ({ value: p.id, label: `${p.name} (${p.id})` })),
        });
    if (!providerChoice) {
      throw new Error('No provider selected');
    }

    // ---------------------------
    // 3️⃣ API key (masked). In quick mode we generate a placeholder.
    // ---------------------------
    const apiKey = options.quick
      ? 'quick-placeholder-key'
      : await prompts.password({
          message: `API key for provider "${providerChoice}"`,
        });
    setSecret(providerChoice, apiKey);

    // ---------------------------
    // 4️⃣ Default model selection
    // ---------------------------
    const { models } = await listModelsForProvider(providerChoice);
    if (!models.length) {
      throw new Error(`No models available for provider ${providerChoice}`);
    }
    const modelChoice = options.quick
      ? models[0].id
      : await prompts.select({
          message: 'Select default model',
          options: models.map((m) => ({
            value: m.id,
            label: `${m.name}${m.free ? ' (free)' : ''}`,
          })),
        });

    // ---------------------------
    // Persist configuration
    // ---------------------------
    const cfg = loadConfig();
    cfg.manager.provider = providerChoice;
    cfg.manager.model = modelChoice;
    saveConfig(cfg);

    // ---------------------------
    // 5️⃣ Quick health check
    // ---------------------------
    await runDoctor({ deep: true });
    logger.ok('Setup completed successfully!');
  } catch (err) {
    console.error(formatError(err, options.debug));
    process.exit(1);
  }
}
