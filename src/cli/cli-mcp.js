// src/cli/cli-mcp.js
/**
 * Command‑line interface for MCP management.
 * Used by bin/open-spider.js via `program.command('mcp [action]')`.
 */
import { logger } from '../core/logger.js';
import { addMcpServer, removeMcpServer, listMcpServers, loadMcpTools } from '../mcp/mcp-manager.js';
import { getServerTools } from '../mcp/tools-loader.js';

export async function handleMcpCommand(action = 'list', ...args) {
  switch (action) {
    case 'add':
      if (!args[0]) {
        logger.error('MCP add requires a URL argument');
        return;
      }
      const added = addMcpServer(args[0]);
      logger.info(`Added MCP server ${added.id} → ${added.url}`);
      break;
    case 'remove':
      if (!args[0]) {
        logger.error('MCP remove requires an ID argument');
        return;
      }
      removeMcpServer(args[0]);
      logger.info(`Removed MCP server ${args[0]}`);
      break;
    case 'list':
      const servers = listMcpServers();
      if (servers.length === 0) {
        logger.info('No MCP servers configured');
      } else {
        logger.info('Configured MCP servers:');
        servers.forEach((s) => logger.info(`- ${s.id}: ${s.url}`));
      }
      break;
    case 'tools':
      if (!args[0]) {
        logger.error('MCP tools requires a server ID');
        return;
      }
      const tools = getServerTools(args[0]);
      if (tools.length === 0) {
        logger.info(`No tools found for server ${args[0]}`);
      } else {
        logger.info(`Tools for server ${args[0]}:`);
        tools.forEach((t) => logger.info(`- ${t.name}`));
      }
      break;
    default:
      logger.warn(`Unknown MCP action "${action}". Available: add, remove, list, tools`);
  }
}
