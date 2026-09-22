/**
 * @file src/cli/models.js
 * CLI command handlers for listing models with Free-First prioritization.
 */

import { getAllProviders } from '../providers/providers-store.js';
import { listModelsForProvider } from '../providers/model-list.js';
import { renderTable } from '../ui/table.js';
import { theme } from '../ui/theme.js';
import { createSpinner } from '../ui/spinner.js';

export async function handleModelsCommand(options = {}) {
  const allProviders = getAllProviders();
  const targetProviders = options.provider
    ? allProviders.filter((p) => p.id === options.provider)
    : allProviders;

  if (targetProviders.length === 0) {
    console.error(`${theme.failPrefix} Provider not found: ${options.provider}`);
    process.exitCode = 1;
    return;
  }

  console.log(theme.matrix('\n=== OPEN-SPIDER MODEL CATALOG (FREE FIRST) ===\n'));

  for (const provider of targetProviders) {
    const spinner = createSpinner(`Loading models for ${provider.name}...`).start();
    const { models, source } = await listModelsForProvider(provider.id, {
      refresh: options.refresh,
      customProviders: allProviders
    });
    spinner.stop();

    let filtered = models;
    if (options.free) filtered = filtered.filter((m) => m.free);
    if (options.paid) filtered = filtered.filter((m) => !m.free);

    if (filtered.length === 0) continue;

    const sourceTag = source === 'curated'
      ? theme.dim('[curated (fallback)]')
      : (source === 'cache' ? theme.dim('[cached]') : theme.successText('[live]'));

    console.log(`${theme.matrix(`Provider: ${provider.name} (${provider.id})`)} ${sourceTag}`);

    const freeList = filtered.filter((m) => m.free);
    const paidList = filtered.filter((m) => !m.free);

    const headers = ['Model ID', 'Display Name', 'Tier'];
    const toRow = (m) => [
      theme.cyan(m.id),
      m.name || m.id,
      m.free ? theme.successText('FREE') : theme.warnText('PAID')
    ];

    const rows = [...freeList.map(toRow), ...paidList.map(toRow)];
    console.log(renderTable(headers, rows));
    console.log('');
  }
}
