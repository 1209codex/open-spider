/**
 * @file src/core/errors.js
 * Error definitions and user-facing formatting with hints.
 */

export class OpenSpiderError extends Error {
  constructor(message, hint = '', code = 'ERR_OPEN_SPIDER') {
    super(message);
    this.name = this.constructor.name;
    this.hint = hint;
    this.code = code;
  }
}

const makeError = (code, defHint) => class extends OpenSpiderError {
  constructor(msg, hint = defHint) { super(msg, hint, code); }
};

export const ConfigError = makeError('ERR_CONFIG', 'Run "open-spider setup" or check your config.json file.');
export const SecretError = makeError('ERR_SECRET', 'Check secrets.json permissions or configure API keys with "open-spider providers add".');
export const AuthError = makeError('ERR_AUTH', 'Verify your API key or authentication tokens with "open-spider providers test".');
export const QuotaError = makeError('ERR_QUOTA', 'Rate limit or quota reached. Consider adding fallback providers in "open-spider setup".');
export const NetworkError = makeError('ERR_NETWORK', 'Check your network connection and API endpoint availability.');
export const WorkerError = makeError('ERR_WORKER', 'Check worker binary availability and permissions with "open-spider doctor".');
export const PlannerError = makeError('ERR_PLANNER', 'Try rephrasing your task prompt or check manager model configuration.');
export const McpError = makeError('ERR_MCP', 'Check MCP server logs or test connectivity with "open-spider mcp test <name>".');

/**
 * Format an error for user display.
 * @param {Error|unknown} error
 * @param {boolean} [debug=false]
 * @returns {string}
 */
export function formatError(error, debug = false) {
  if (!error) return 'Unknown error occurred.';

  const isSpiderError = error instanceof OpenSpiderError;
  const message = error.message || String(error);
  const hint = isSpiderError && error.hint ? `\nhint: ${error.hint}` : '';

  if (debug && error.stack) {
    return `${message}${hint}\n\nStack trace:\n${error.stack}`;
  }

  return `${message}${hint}`;
}
