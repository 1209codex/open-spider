// src/cli/cli-plugins.js
/**
 * Command‑line interface for plugin management.
 * Used by bin/open-spider.js via `program.command('plugins [action]')`.
 */
import { logger } from '../core/logger.js';
import { listPlugins, installPlugin, removePlugin } from '../plugins/plugin-manager.js';

export async function handlePluginsCommand(action = 'list', ...args) {
  switch (action) {
    case 'list': {
      const plugins = listPlugins();
      if (plugins.length === 0) {
        logger.info('No plugins installed');
      } else {
        logger.info('Installed plugins:');
        plugins.forEach((p) => logger.info(`- ${p}`));
      }
      break;
    }
    case 'install': {
      if (!args[0]) {
        logger.error('install requires a package spec (name, git url, or path)');
        return;
      }
      installPlugin(args[0]);
      logger.info(`Plugin ${args[0]} installed`);
      break;
    }
    case 'remove': {
      if (!args[0]) {
        logger.error('remove requires a plugin name');
        return;
      }
      removePlugin(args[0]);
      logger.info(`Plugin ${args[0]} removed`);
      break;
    }
    default:
      logger.warn(`Unknown plugins action "${action}". Available: list, install, remove`);
  }
}
