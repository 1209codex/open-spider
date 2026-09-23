// src/cli/serve.js

/**
 * CLI handler for `open-spider serve` – starts the minimal web UI server.
 */
export async function handleServeCommand() {
  try {
    const { startServer } = await import('../webapp/server.js');
    await startServer();
  } catch (err) {
    console.error('Failed to start web UI server:', err);
    process.exit(1);
  }
}
