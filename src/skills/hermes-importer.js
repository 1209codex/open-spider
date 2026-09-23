// src/skills/hermes-importer.js
/**
 * Discovers and imports skills from Hermes Agent (~/.hermes/skills/).
 * Parses SKILL.md frontmatter and extracts structured skill instructions.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

/**
 * Parses simple YAML frontmatter from a SKILL.md file without external dependencies.
 */
export function parseSkillFile(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

    if (!match) {
      return {
        id: filePath.split('/').slice(-2)[0] || 'skill',
        name: filePath.split('/').slice(-2)[0] || 'Skill',
        description: raw.slice(0, 150).replace(/[#*\n]/g, ' ').trim(),
        instructions: raw.trim(),
        tags: ['general'],
        source: 'hermes'
      };
    }

    const frontmatterRaw = match[1];
    const body = match[2].trim();

    // Parse simple key-values
    const nameMatch = frontmatterRaw.match(/name:\s*["']?([^"'\n]+)["']?/i);
    const descMatch = frontmatterRaw.match(/description:\s*["']?([^"'\n]+)["']?/i);
    const tagsMatch = frontmatterRaw.match(/tags:\s*\[(.*?)\]/i);

    const name = nameMatch ? nameMatch[1].trim() : filePath.split('/').slice(-2)[0] || 'skill';
    const description = descMatch ? descMatch[1].trim() : body.slice(0, 150).replace(/[#*\n]/g, ' ').trim();
    
    let tags = ['hermes', 'imported'];
    if (tagsMatch && tagsMatch[1]) {
      const parsedTags = tagsMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, '').toLowerCase()).filter(Boolean);
      tags.push(...parsedTags);
    }

    return {
      id: name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      name,
      description,
      tags: Array.from(new Set(tags)),
      instructions: body,
      source: 'hermes'
    };
  } catch {
    return null;
  }
}

/**
 * Recursively scans directory for SKILL.md files.
 */
export function scanSkillDirectory(dirPath, results = []) {
  if (!existsSync(dirPath)) return results;

  try {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        const skillMd = join(fullPath, 'SKILL.md');
        if (existsSync(skillMd)) {
          const parsed = parseSkillFile(skillMd);
          if (parsed) results.push(parsed);
        } else {
          scanSkillDirectory(fullPath, results);
        }
      } else if (entry === 'SKILL.md') {
        const parsed = parseSkillFile(fullPath);
        if (parsed) results.push(parsed);
      }
    }
  } catch {
    // Ignore read errors
  }

  return results;
}

/**
 * Discovers and returns all available Hermes skills.
 */
export function discoverHermesSkills(customPath = null) {
  const defaultHermesPath = customPath || join(homedir(), '.hermes', 'skills');
  return scanSkillDirectory(defaultHermesPath);
}
