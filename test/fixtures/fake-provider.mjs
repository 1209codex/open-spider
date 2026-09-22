/**
 * @file test/fixtures/fake-provider.mjs
 * Mock LLM API server simulating OpenAI-compatible endpoints with rate limits and error states.
 */

import http from 'node:http';

export function createFakeProviderServer(opts = {}) {
  let rateLimitCount = opts.rateLimitCount || 0;
  let authError = !!opts.authError;
  let callCount = 0;

  const server = http.createServer((req, res) => {
    callCount++;
    const authHeader = req.headers['authorization'] || '';

    if (authError || (opts.requiredKey && authHeader !== `Bearer ${opts.requiredKey}`)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Invalid API Key', type: 'invalid_request_error', code: 'invalid_api_key' } }));
      return;
    }

    if (rateLimitCount > 0) {
      rateLimitCount--;
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '1' });
      res.end(JSON.stringify({ error: { message: 'Rate limit reached. Quota exceeded.', type: 'insufficient_quota' } }));
      return;
    }

    if (req.method === 'GET' && req.url === '/models') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: [
          { id: 'fake-free-model:free', name: 'Fake Free Model', pricing: { prompt: 0, completion: 0 } },
          { id: 'fake-paid-model', name: 'Fake Paid Model', pricing: { prompt: 0.002, completion: 0.002 } }
        ]
      }));
      return;
    }

    if (req.method === 'POST' && req.url === '/chat/completions') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        const parsed = JSON.parse(body || '{}');
        const reply = opts.replyContent || 'Mock LLM Response';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: 'chatcmpl-mock-123',
          object: 'chat.completion',
          created: Date.now(),
          model: parsed.model || 'mock-model',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: reply },
              finish_reason: 'stop'
            }
          ]
        }));
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return {
    server,
    getCallCount: () => callCount,
    setRateLimitCount: (n) => { rateLimitCount = n; },
    setAuthError: (b) => { authError = b; },
    start: () => new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        resolve({ port, url: `http://127.0.0.1:${port}` });
      });
    }),
    stop: () => new Promise((resolve) => {
      server.close(resolve);
    })
  };
}
