// src/skills/skills-manager.js
/**
 * Open-Spider Self-Learning & Skill Registry Manager.
 * Replicates and integrates skills from Hermes agent, records self-learned patterns,
 * and matches skills for automatic injection into task planning.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getDataDir } from '../core/paths.js';
import { discoverHermesSkills } from './hermes-importer.js';
import { logger } from '../core/logger.js';

const getSkillsDir = () => join(getDataDir(), 'skills');
const getSkillsStoreFile = () => join(getSkillsDir(), 'skills.json');

/**
 * Built-in foundational skills.
 */
const DEFAULT_BUILTIN_SKILLS = [
  {
    id: 'systematic-debugging',
    name: 'Systematic Debugging',
    description: 'Diagnose root causes before modifying code by checking stack traces, logs, and minimal reproductions.',
    tags: ['debug', 'troubleshooting', 'testing'],
    instructions: '1. Form hypothesis from error logs.\n2. Reproduce with minimal script.\n3. Verify fix against regression test.',
    source: 'builtin'
  },
  {
    id: 'safe-refactoring',
    name: 'Safe Refactoring',
    description: 'Refactor code incrementally without altering external behavior or adding native addons.',
    tags: ['refactor', 'clean-code', 'architecture'],
    instructions: '1. Run test suite before change.\n2. Make single contiguous edits.\n3. Re-verify with tests after each step.',
    source: 'builtin'
  },
  {
    id: 'api-endpoint-design',
    name: 'REST API Endpoint Design',
    description: 'Design robust, JSON-formatted REST API endpoints using standard HTTP status codes and pure JS.',
    tags: ['backend', 'api', 'http'],
    instructions: '1. Handle CORS preflight.\n2. Validate request bodies.\n3. Return consistent { error } payloads on failure.',
    source: 'builtin'
  }
];

function loadSkillsStore() {
  const dir = getSkillsDir();
  const file = getSkillsStoreFile();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });

  if (!existsSync(file)) {
    saveSkillsStore(DEFAULT_BUILTIN_SKILLS);
    return DEFAULT_BUILTIN_SKILLS;
  }

  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return DEFAULT_BUILTIN_SKILLS;
  }
}

function saveSkillsStore(skills) {
  const dir = getSkillsDir();
  const file = getSkillsStoreFile();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    writeFileSync(file, JSON.stringify(skills, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    logger.warn(`Failed to save skills store: ${err.message}`);
  }
}

export function listSkills() {
  return loadSkillsStore();
}

export function getSkill(skillId) {
  const skills = loadSkillsStore();
  return skills.find((s) => s.id === skillId || s.name.toLowerCase() === skillId.toLowerCase());
}

export function learnSkill({ name, description, tags = [], instructions, learnedFrom = 'self-learned' }) {
  if (!name || !instructions) {
    throw new Error('Skill name and instructions are required');
  }

  const skills = loadSkillsStore();
  const id = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const existingIdx = skills.findIndex((s) => s.id === id);

  const newSkill = {
    id,
    name,
    description: description || `Learned skill for ${name}`,
    tags: Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim().toLowerCase()),
    instructions,
    source: learnedFrom || 'self-learned',
    updatedAt: Date.now()
  };

  if (existingIdx >= 0) {
    skills[existingIdx] = newSkill;
  } else {
    skills.push(newSkill);
  }

  saveSkillsStore(skills);
  logger.ok(`Learned and indexed skill [${name}] (source: ${learnedFrom})`);
  return newSkill;
}

export function importHermesSkills(customPath = null) {
  const hermesSkills = discoverHermesSkills(customPath);
  if (hermesSkills.length === 0) {
    return { count: 0, imported: [] };
  }

  const skills = loadSkillsStore();
  const imported = [];

  for (const hSkill of hermesSkills) {
    const existingIdx = skills.findIndex((s) => s.id === hSkill.id);
    if (existingIdx >= 0) {
      skills[existingIdx] = { ...skills[existingIdx], ...hSkill, source: 'hermes' };
    } else {
      skills.push(hSkill);
    }
    imported.push(hSkill.id);
  }

  saveSkillsStore(skills);
  logger.ok(`Successfully replicated and imported ${hermesSkills.length} skill(s) from Hermes Agent`);
  return { count: hermesSkills.length, imported };
}

export function findRelevantSkills(queryText = '', tags = []) {
  const skills = loadSkillsStore();
  if (!queryText && (!tags || tags.length === 0)) return [];

  const lowerQuery = queryText.toLowerCase();
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  return skills.filter((s) => {
    const hasTagMatch = s.tags?.some((t) => tagSet.has(t.toLowerCase()));
    const hasNameMatch = s.name.toLowerCase().includes(lowerQuery) || lowerQuery.includes(s.name.toLowerCase());
    const hasDescMatch = s.description?.toLowerCase().includes(lowerQuery);
    return hasTagMatch || hasNameMatch || hasDescMatch;
  });
}

/**
 * Injects relevant skills guidelines into task planning or worker instructions.
 */
export function buildSkillsGuidanceContext(taskQuery = '', tags = []) {
  const relevant = findRelevantSkills(taskQuery, tags);
  if (relevant.length === 0) return '';

  let output = `\n=== RELEVANT AGENT SKILLS & LEARNED PRACTICES ===\n`;
  for (const skill of relevant.slice(0, 3)) {
    output += `[Skill: ${skill.name} (${skill.source})]\n${skill.instructions.slice(0, 400)}\n\n`;
  }
  return output;
}
