/**
 * @file src/providers/llm-client.js
 * Resilient OpenAI-compatible LLM client with streaming, retry backoff, and error mapping.
 */

import { AuthError, QuotaError, NetworkError, OpenSpiderError } from '../core/errors.js';

export class LLMClient {
  /**
   * @param {object} opts
   * @param {string} opts.baseUrl
   * @param {string} [opts.apiKey]
   * @param {object} [opts.headers]
   * @param {number} [opts.maxRetries=2]
   * @param {number} [opts.timeoutMs=60000]
   */
  constructor(opts) {
    this.baseUrl = (opts.baseUrl || '').replace(/\/+$/, '');
    this.apiKey = opts.apiKey || '';
    this.customHeaders = opts.headers || {};
    this.maxRetries = opts.maxRetries ?? 2;
    this.timeoutMs = opts.timeoutMs ?? 60000;
  }

  /**
   * Executes chat completion call with retries and exponential backoff.
   * @param {object} params
   * @param {string} params.model
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {number} [params.temperature=0.7]
   * @param {boolean} [params.json=false]
   * @param {number} [params.maxTokens]
   * @returns {Promise<{content: string, raw: object}>}
   */
  async complete(params) {
    const url = `${this.baseUrl}/chat/completions`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.customHeaders
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const payload = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7
    };

    if (params.json) {
      payload.response_format = { type: 'json_object' };
    }
    if (params.maxTokens) {
      payload.max_tokens = params.maxTokens;
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const choice = data.choices && data.choices[0];
          const content = choice && choice.message ? choice.message.content : '';
          return { content, raw: data };
        }

        const errorBody = await res.text().catch(() => '');
        const status = res.status;

        if (status === 401 || status === 403) {
          throw new AuthError(`Authentication failed (${status}): ${errorBody}`);
        }

        if (status === 429 || errorBody.toLowerCase().includes('quota') || errorBody.toLowerCase().includes('rate limit')) {
          if (attempt < this.maxRetries) {
            attempt++;
            const backoff = Math.pow(2, attempt) * 1000;
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
          throw new QuotaError(`Rate limit / Quota exceeded (${status}): ${errorBody}`);
        }

        if (status >= 500 && attempt < this.maxRetries) {
          attempt++;
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        throw new OpenSpiderError(`LLM API returned error (${status}): ${errorBody}`);
      } catch (err) {
        if (err instanceof OpenSpiderError) {
          throw err;
        }
        if (err.name === 'AbortError') {
          throw new NetworkError(`LLM request timed out after ${this.timeoutMs}ms`);
        }
        if (attempt < this.maxRetries) {
          attempt++;
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw new NetworkError(`Network error connecting to LLM provider (${this.baseUrl}): ${err.message}`);
      }
    }
  }
}
