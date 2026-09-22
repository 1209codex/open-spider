/**
 * @file src/core/errors.js
 * Error definitions and user-facing formatting with hints.
 */

export class OpenSpiderError extends Error {
  /**
   * @param {string} message
   * @param {string} [hint]
   * @param {string} [code]
   */
  constructor(message, hint = '', code = 'ERR_OPEN_SPIDER') {
    super(message);
    this.name = this.constructor.name;
    this.hint = hint;
    this.code = code;
  }
}

export class ConfigError extends OpenSpiderError {
  constructor(message, hint = 'Run "open-spider setup" or check your config.json file.') {
    super(message, hint, 'ERR_CONFIG');
  }
}

export class SecretError extends OpenSpiderError {
  constructor(message, hint = 'Check secrets.json permissions or configure API keys with "open-spider providers add".') {
    super(message, hint, 'ERR_SECRET');
  }
}

export class AuthError extends OpenSpiderError {
  constructor(message, hint = 'Verify your API key or authentication tokens with "open-spider providers test".') {
    super(message, hint, 'ERR_AUTH');
  }
}

export class QuotaError extends OpenSpiderError {
  constructor(message, hint = 'Rate limit or quota reached. Consider adding fallback providers in "open-spider setup".') {
    super(message, hint, 'ERR_QUOTA');
  }
}

export class NetworkError extends OpenSpiderError {
  constructor(message, hint = 'Check your network connection and API endpoint availability.') {
    super(message, hint, 'ERR_NETWORK');
  }
}

export class WorkerError extends OpenSpiderError {
  constructor(message, hint = 'Check worker binary availability and permissions with "open-spider doctor".') {
    super(message, hint, 'ERR_WORKER');
  }
}

export class PlannerError extends OpenSpiderError {
  constructor(message, hint = 'Try rephrasing your task prompt or check manager model configuration.') {
    super(message, hint, 'ERR_PLANNER');
  }
}

export class McpError extends OpenSpiderError {
  constructor(message, hint = 'Check MCP server logs or test connectivity with "open-spider mcp test <name>".') {
    super(message, hint, 'ERR_MCP');
  }
}

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
