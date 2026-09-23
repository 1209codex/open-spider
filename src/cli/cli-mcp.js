// src/cli/cli-mcp.js
/**
 * Command‑line interface for MCP management.
 * Used by bin/open-spider.js via `program.command('mcp [action]')`.
 */
import { logger } from '../core/logger.js';
import { addMcpServer, removeMcpServer, listMcpServers, loadMcpTools } from '../mcp/mcp-manager.js';
import { getServerTools } from '../mcp/tools-loader.js';
import { renderTable } from '../ui/table.js';
import { theme } from '../ui/theme.js';

export async function handleMcpCommand(action = 'list', ...args) {
  switch (action) {
    case 'add': {
      if (!args[0]) {
        logger.error('Usage: open-spider mcp add <url>');
        return;
      }
      const added = addMcpServer(args[0]);
      logger.ok(`Added MCP server ${theme.highlight(added.id)} -> ${added.url}`);
      break;
    }

    case 'add-git': {
      if (!args[0]) {
        logger.error('Usage: open-spider mcp add-git <owner/repo>');
        return;
      }
      const repo = args[0].replace(/^https:\/\/github.com\//, '').replace(/\.git$/, '');
      const gitMcpUrl = `git+https://github.com/${repo}.git`;
      const added = addMcpServer(gitMcpUrl);
      logger.ok(`Added Git MCP server ${theme.highlight(added.id)} -> ${added.url}`);
      break;
    }

    case 'remove': {
      if (!args[0]) {
        logger.error('Usage: open-spider mcp remove <id>');
        return;
      }
      removeMcpServer(args[0]);
      logger.ok(`Removed MCP server ${args[0]}`);
      break;
    }

    case 'list': {
      const servers = listMcpServers();
      if (servers.length === 0) {
        logger.info('No MCP servers configured. Add one with: open-spider mcp add <url>');
        return;
      }
      const headers = ['Server ID', 'Endpoint / URL'];
      const rows = servers.map((s) => [theme.cyan(s.id), s.url]);
      console.log(theme.matrix('\n=== CONFIGURED MCP SERVERS ===\n'));
      console.log(renderTable(headers, rows));
      console.log('');
      break;
    }

    case 'tools': {
      if (!args[0]) {
        logger.error('Usage: open-spider mcp tools <serverId>');
        return;
      }
      const tools = getServerTools(args[0]);
      if (tools.length === 0) {
        logger.info(`No tools registered or active for server ${args[0]}`);
      } else {
        logger.info(`Tools for server ${args[0]}:`);
        tools.forEach((t) => logger.info(`- ${t.name}`));
      }
      break;
    }

    default:
      logger.warn(`Unknown MCP action "${action}". Available: add, add-git, list, remove, tools`);
  }
}
