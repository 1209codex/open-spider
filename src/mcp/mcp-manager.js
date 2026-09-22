// src/mcp/mcp-manager.js
/**
 * Simple MCP server registry and tool loader.
 * Stores server entries in a JSON file under the app data dir.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getDataDir } from '../core/paths.js';

const MCP_FILE = join(getDataDir(), 'mcp.json');

/** Load the MCP registry, creating an empty file if needed. */
export function loadMcpRegistry() {
  const dir = getDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (!existsSync(MCP_FILE)) {
    saveMcpRegistry([]);
    return [];
  }
  try {
    return JSON.parse(readFileSync(MCP_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/** Persist the MCP registry. */
export function saveMcpRegistry(registry) {
  const dir = getDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(MCP_FILE, JSON.stringify(registry, null, 2), { mode: 0o600 });
}

/** Add a new MCP server (url). Returns the assigned id. */
export function addMcpServer(url) {
  const registry = loadMcpRegistry();
  const id = `mcp${registry.length + 1}`;
  registry.push({ id, url });
  saveMcpRegistry(registry);
  return { id, url };
}

/** Remove a server by id. */
export function removeMcpServer(id) {
  const registry = loadMcpRegistry();
  const filtered = registry.filter((s) => s.id !== id);
  saveMcpRegistry(filtered);
  return filtered;
}

/** List all servers. */
export function listMcpServers() {
  return loadMcpRegistry();
}

/** Load tool schemas for a given server id. */
export function loadMcpTools(serverId) {
  const registry = loadMcpRegistry();
  const server = registry.find((s) => s.id === serverId);
  if (!server) return [];
  // Assume tools are stored under $HOME/.open-spider/mcp/<serverName>/tools/*.json
  const toolsDir = join(getDataDir(), 'mcp', serverId, 'tools');
  try {
    const entries = require('fs').readdirSync(toolsDir);
    return entries
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ name: f.replace(/\.json$/, ''), path: join(toolsDir, f) }));
  } catch {
    return [];
  }
}

export const mcp = {
  addMcpServer,
  removeMcpServer,
  listMcpServers,
  loadMcpTools,
};
