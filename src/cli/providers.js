/**
 * @file src/cli/providers.js
 * CLI command handlers for managing LLM API providers with strict Free-First prioritization.
 */

import { getAllProviders, addProvider, removeProvider } from '../providers/providers-store.js';
import { findProvider } from '../data/providers.catalog.js';
import { getSecret, maskSecret, setSecret } from '../core/secrets.js';
import { setConfigValue, getConfigValue } from '../core/config.js';
import { LLMClient } from '../providers/llm-client.js';
import { listModelsForProvider } from '../providers/model-list.js';
import { renderTable } from '../ui/table.js';
import { theme } from '../ui/theme.js';
import { askSelect, askText, askPassword, askConfirm } from '../ui/prompts.js';
import { createSpinner } from '../ui/spinner.js';

export async function listProviders() {
  const providers = getAllProviders();
  const activeManagerProvider = getConfigValue('manager.provider');

  console.log(theme.matrix('\n=== LLM API PROVIDERS (FREE FIRST) ===\n'));

  const freeProviders = providers.filter((p) => p.free);
  const paidProviders = providers.filter((p) => !p.free);

  const formatRows = (list) => {
    return list.map((p) => {
      const isDefault = p.id === activeManagerProvider ? theme.matrix('★ (manager)') : '';
      const key = getSecret(p.id, p.envKey);
      const keyDisplay = key ? maskSecret(key) : theme.dim('(no key)');
      return [
        theme.cyan(p.id),
        `${p.name} ${isDefault}`,
        p.free ? theme.successText('FREE') : theme.warnText('PAID'),
        keyDisplay,
        theme.dim(p.freeNote || '')
      ];
    });
  };

  const headers = ['Provider ID', 'Name', 'Tier', 'API Key', 'Notes'];

  console.log(theme.matrix('--- FREE TIER PROVIDERS ---'));
  console.log(renderTable(headers, formatRows(freeProviders)));
  console.log('');

  console.log(theme.matrix('--- PAID TIER PROVIDERS ---'));
  console.log(renderTable(headers, formatRows(paidProviders)));
  console.log('');
}

export async function addProviderInteractive(options = {}) {
  const providers = getAllProviders();
  const choices = providers.map((p) => ({
    value: p.id,
    label: `${p.free ? '[FREE]' : '[PAID]'} ${p.name} (${p.id})`
  }));
  choices.push({ value: 'custom', label: '[CUSTOM] Add custom OpenAI-compatible endpoint' });

  const chosenId = await askSelect({
    message: 'Select a provider to configure:',
    options: choices
  });

  let providerDef;
  if (chosenId === 'custom') {
    const id = await askText({ message: 'Enter provider ID (e.g. my-llm):', validate: (v) => v ? undefined : 'Required' });
    const name = await askText({ message: 'Enter provider display name:', initialValue: id });
    const baseUrl = await askText({ message: 'Enter OpenAI-compatible Base URL:', placeholder: 'https://api.example.com/v1' });
    const isFree = await askConfirm({ message: 'Is this provider free / local?', initialValue: false });
    providerDef = { id, name, baseUrl, type: 'openai-compatible', free: isFree };
  } else {
    providerDef = findProvider(chosenId);
  }

  const apiKey = await askPassword({
    message: `Enter API key for ${providerDef.name} (leave blank if not needed):`
  });

  const spinner = createSpinner(`Testing connectivity to ${providerDef.name}...`).start();
  try {
    const client = new LLMClient({ baseUrl: providerDef.baseUrl, apiKey, timeoutMs: 10000 });
    const modelsResult = await listModelsForProvider(providerDef.id, { refresh: true });
    spinner.succeed(`Connected successfully to ${providerDef.name}! Found ${modelsResult.models.length} models.`);
  } catch (err) {
    spinner.fail(`Connection check warning: ${err.message}`);
    const proceed = await askConfirm({ message: 'Save this configuration anyway?', initialValue: true });
    if (!proceed) return;
  }

  addProvider(providerDef, apiKey);
  console.log(`${theme.okPrefix} Saved provider ${theme.highlight(providerDef.id)}.`);
}

export async function testProvider(providerId) {
  const provider = findProvider(providerId, getAllProviders());
  if (!provider) {
    console.error(`${theme.failPrefix} Unknown provider: ${providerId}`);
    process.exitCode = 1;
    return;
  }

  const apiKey = getSecret(provider.id, provider.envKey);
  const spinner = createSpinner(`Testing provider ${theme.highlight(provider.id)}...`).start();

  try {
    const { models, source } = await listModelsForProvider(provider.id, { refresh: true });
    spinner.succeed(`Provider ${provider.id} is healthy (${source}). Discovered ${models.length} models.`);
  } catch (err) {
    spinner.fail(`Provider test failed: ${err.message}`);
    process.exitCode = 1;
  }
}

export async function useProvider(providerId, modelId) {
  const provider = findProvider(providerId, getAllProviders());
  if (!provider) {
    console.error(`${theme.failPrefix} Unknown provider: ${providerId}`);
    process.exitCode = 1;
    return;
  }

  setConfigValue('manager.provider', providerId);
  if (modelId) {
    setConfigValue('manager.model', modelId);
  } else if (provider.defaultModel) {
    setConfigValue('manager.model', provider.defaultModel);
  }

  console.log(`${theme.okPrefix} Manager provider set to ${theme.highlight(providerId)} (model: ${theme.highlight(getConfigValue('manager.model'))}).`);
}

export async function handleProvidersCommand(action, arg1, arg2) {
  if (!action || action === 'list') {
    await listProviders();
    return;
  }
  if (action === 'add') {
    await addProviderInteractive();
    return;
  }
  if (action === 'remove' || action === 'rm') {
    if (!arg1) {
      console.error(`${theme.failPrefix} Specify provider ID to remove.`);
      process.exitCode = 1;
      return;
    }
    removeProvider(arg1);
    console.log(`${theme.okPrefix} Removed provider ${arg1}.`);
    return;
  }
  if (action === 'test') {
    await testProvider(arg1);
    return;
  }
  if (action === 'use') {
    if (!arg1) {
      console.error(`${theme.failPrefix} Specify provider ID to use.`);
      process.exitCode = 1;
      return;
    }
    await useProvider(arg1, arg2);
    return;
  }
  console.error(`${theme.failPrefix} Unknown providers action: ${action}`);
}
