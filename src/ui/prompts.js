/**
 * @file src/ui/prompts.js
 * Interactive prompt helpers themed to match Open-spider terminal aesthetics.
 */

import * as clack from '@clack/prompts';
import { theme } from './theme.js';

export function isPromptCancel(val) {
  return clack.isCancel(val);
}

export function handlePromptCancel() {
  clack.cancel(theme.warnText('Operation cancelled by user.'));
  process.exit(0);
}

/**
 * Text input prompt.
 * @param {object} opts
 * @returns {Promise<string>}
 */
export async function askText(opts) {
  const result = await clack.text(opts);
  if (isPromptCancel(result)) handlePromptCancel();
  return result;
}

/**
 * Password/secret input prompt.
 * @param {object} opts
 * @returns {Promise<string>}
 */
export async function askPassword(opts) {
  const result = await clack.password(opts);
  if (isPromptCancel(result)) handlePromptCancel();
  return result;
}

/**
 * Select from a list of options.
 * @param {object} opts
 * @returns {Promise<any>}
 */
export async function askSelect(opts) {
  const result = await clack.select(opts);
  if (isPromptCancel(result)) handlePromptCancel();
  return result;
}

/**
 * Multiselect from options.
 * @param {object} opts
 * @returns {Promise<any[]>}
 */
export async function askMultiSelect(opts) {
  const result = await clack.multiselect(opts);
  if (isPromptCancel(result)) handlePromptCancel();
  return result;
}

/**
 * Confirmation yes/no prompt.
 * @param {object} opts
 * @returns {Promise<boolean>}
 */
export async function askConfirm(opts) {
  const result = await clack.confirm(opts);
  if (isPromptCancel(result)) handlePromptCancel();
  return result;
}
