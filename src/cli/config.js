/**
 * @file src/cli/config.js
 * CLI command handler for config inspection and modification (get | set | path).
 */

import { getConfigValue, setConfigValue, loadConfig, DEFAULT_CONFIG } from '../core/config.js';
import { getConfigFile } from '../core/paths.js';
import { logger } from '../core/logger.js';
import { theme } from '../ui/theme.js';

export function handleConfigCommand(action = 'get', key = null, value = null) {
  switch (action) {
    case 'path': {
      console.log(getConfigFile());
      break;
    }

    case 'get': {
      if (!key) {
        const full = loadConfig();
        console.log(JSON.stringify(full, null, 2));
      } else {
        const val = getConfigValue(key);
        if (val === undefined) {
          logger.warn(`Key "${key}" is not set.`);
        } else if (typeof val === 'object') {
          console.log(JSON.stringify(val, null, 2));
        } else {
          console.log(val);
        }
      }
      break;
    }

    case 'set': {
      if (!key || value === undefined) {
        logger.error('Usage: open-spider config set <key> <value>');
        return;
      }
      // Parse boolean or numbers if applicable
      let parsedVal = value;
      if (value === 'true') parsedVal = true;
      else if (value === 'false') parsedVal = false;
      else if (!isNaN(Number(value)) && value.trim() !== '') parsedVal = Number(value);

      setConfigValue(key, parsedVal);
      logger.ok(`Set configuration "${key}" = ${JSON.stringify(parsedVal)}`);
      break;
    }

    default:
      logger.warn(`Unknown config action "${action}". Available: get, set, path`);
  }
}
