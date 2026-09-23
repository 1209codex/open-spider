// src/cli/cli-skills.js
/**
 * CLI command handler for Open-Spider skills and self-learning management.
 *
 * Commands:
 *   open-spider skills list                – List all active and self-learned skills.
 *   open-spider skills import-hermes [path]– Replicate & import skills from Hermes agent.
 *   open-spider skills learn <name> <text> – Record a new self-learned skill.
 *   open-spider skills show <id>           – View complete instructions for a skill.
 *   open-spider skills search <query>      – Search skills by keywords or tags.
 */

import { listSkills, getSkill, learnSkill, importHermesSkills, findRelevantSkills } from '../skills/skills-manager.js';
import { renderTable } from '../ui/table.js';
import { theme } from '../ui/theme.js';
import { logger } from '../core/logger.js';

export async function handleSkillsCommand(action = 'list', arg1 = null, arg2 = null, arg3 = null) {
  switch (action) {
    case 'list': {
      const skills = listSkills();
      const headers = ['Skill Name', 'Source', 'Tags', 'Description'];
      const rows = skills.map((s) => {
        let sourceBadge = theme.dim(s.source);
        if (s.source === 'hermes') sourceBadge = theme.cyan('hermes');
        else if (s.source === 'self-learned') sourceBadge = theme.okText('self-learned');

        return [
          theme.highlight(s.name),
          sourceBadge,
          theme.dim((s.tags || []).slice(0, 3).join(', ')),
          s.description && s.description.length > 45 ? s.description.slice(0, 42) + '...' : (s.description || '')
        ];
      });

      console.log(theme.matrix(`\n=== OPEN-SPIDER SKILLS REGISTRY (${skills.length} Loaded) ===\n`));
      console.log(renderTable(headers, rows));
      console.log(theme.dim('\nCommands: open-spider skills import-hermes | learn | show <id>\n'));
      break;
    }

    case 'import-hermes': {
      logger.info('Scanning and replicating skills from Hermes Agent...');
      const result = importHermesSkills(arg1);
      if (result.count === 0) {
        logger.warn('No Hermes skills found at ~/.hermes/skills/. Provide custom path if located elsewhere.');
      } else {
        logger.ok(`Imported ${theme.highlight(String(result.count))} skill(s) from Hermes Agent into Open-Spider.`);
      }
      break;
    }

    case 'learn': {
      if (!arg1 || !arg2) {
        logger.error('Usage: open-spider skills learn <name> "<instructions>" [tags]');
        return;
      }
      const tags = arg3 ? arg3.split(',') : ['learned'];
      const skill = learnSkill({
        name: arg1,
        instructions: arg2,
        tags,
        learnedFrom: 'self-learned'
      });
      logger.ok(`Skill [${theme.highlight(skill.name)}] successfully saved and indexed into Open-Spider.`);
      break;
    }

    case 'show': {
      if (!arg1) {
        logger.error('Usage: open-spider skills show <skill-id>');
        return;
      }
      const skill = getSkill(arg1);
      if (!skill) {
        logger.fail(`Skill "${arg1}" not found in registry.`);
        return;
      }
      console.log(theme.matrix(`\n=== SKILL: ${skill.name} (${skill.source}) ===\n`));
      console.log(`Tags: ${theme.cyan(skill.tags?.join(', ') || 'none')}`);
      console.log(`Description: ${skill.description || 'No description'}\n`);
      console.log(theme.matrix('--- INSTRUCTIONS ---'));
      console.log(skill.instructions);
      console.log('');
      break;
    }

    case 'search': {
      if (!arg1) {
        logger.error('Usage: open-spider skills search <query>');
        return;
      }
      const matches = findRelevantSkills(arg1, [arg1]);
      console.log(theme.matrix(`\n=== SEARCH RESULTS FOR "${arg1}" (${matches.length} Matches) ===\n`));
      matches.forEach((s) => {
        console.log(`  - ${theme.highlight(s.name)} [${theme.cyan(s.source)}]: ${s.description || ''}`);
      });
      console.log('');
      break;
    }

    default:
      logger.warn(`Unknown skills action "${action}". Available: list, import-hermes, learn, show, search`);
  }
}
