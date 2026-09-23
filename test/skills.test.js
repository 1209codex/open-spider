// test/skills.test.js
/**
 * Test suite for Hermes skills discovery, YAML frontmatter parsing,
 * self-learning skill recording, query search, planner context injection, and REST API.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import http from 'node:http';

import { parseSkillFile, scanSkillDirectory, discoverHermesSkills } from '../src/skills/hermes-importer.js';
import {
  listSkills,
  getSkill,
  learnSkill,
  importHermesSkills,
  findRelevantSkills,
  buildSkillsGuidanceContext
} from '../src/skills/skills-manager.js';
import { startServer } from '../src/webapp/server.js';

let server;
let port;
const testDir = join(tmpdir(), `open-spider-skills-test-${Date.now()}`);

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

describe('Hermes Skills Importer & Parser', () => {
  before(() => {
    mkdirSync(testDir, { recursive: true });
  });

  test('parseSkillFile parses YAML frontmatter with tags and instructions', () => {
    const filePath = join(testDir, 'SKILL.md');
    const content = `---
name: ArXiv Research Explorer
description: Search and download academic papers from ArXiv API
tags: [research, academic, arxiv, api]
---
# ArXiv Research Instructions
1. Format queries with proper category prefixes.
2. Filter recent papers by date.`;
    writeFileSync(filePath, content, 'utf8');

    const parsed = parseSkillFile(filePath);
    assert.ok(parsed);
    assert.equal(parsed.name, 'ArXiv Research Explorer');
    assert.equal(parsed.description, 'Search and download academic papers from ArXiv API');
    assert.ok(parsed.tags.includes('research'));
    assert.ok(parsed.tags.includes('arxiv'));
    assert.ok(parsed.instructions.includes('Format queries'));
    assert.equal(parsed.source, 'hermes');
  });

  test('scanSkillDirectory recursively finds all SKILL.md files', () => {
    const subDir = join(testDir, 'sub-skill');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, 'SKILL.md'), `---
name: Sub Skill
description: Nested skill
tags: [nested]
---
Instructions for sub skill.`, 'utf8');

    const discovered = scanSkillDirectory(testDir);
    assert.ok(discovered.length >= 2);
    const names = discovered.map((d) => d.name);
    assert.ok(names.includes('ArXiv Research Explorer'));
    assert.ok(names.includes('Sub Skill'));
  });
});

describe('Skills Manager & Self-Learning Registry', () => {
  test('listSkills returns built-in skills by default', () => {
    const skills = listSkills();
    assert.ok(Array.isArray(skills));
    assert.ok(skills.length >= 3);
    const names = skills.map((s) => s.name);
    assert.ok(names.includes('Systematic Debugging'));
    assert.ok(names.includes('Safe Refactoring'));
  });

  test('learnSkill records and indexes a new self-learned skill', () => {
    const learned = learnSkill({
      name: 'Deterministic JSON Parsing',
      description: 'Techniques for robustly repairing and extracting JSON from LLMs',
      tags: ['json', 'parsing', 'llm-output'],
      instructions: '1. Strip markdown fences.\n2. Balance brackets.\n3. Validate with zod.'
    });

    assert.ok(learned.id);
    assert.equal(learned.name, 'Deterministic JSON Parsing');
    assert.equal(learned.source, 'self-learned');

    const fetched = getSkill('deterministic-json-parsing');
    assert.ok(fetched);
    assert.equal(fetched.name, 'Deterministic JSON Parsing');
  });

  test('findRelevantSkills matches queries by keywords and tags', () => {
    const matches = findRelevantSkills('repairing JSON responses from LLMs', ['parsing']);
    assert.ok(matches.length > 0);
    assert.ok(matches.some((m) => m.name === 'Deterministic JSON Parsing'));
  });

  test('buildSkillsGuidanceContext formats markdown context for planner & workers', () => {
    const context = buildSkillsGuidanceContext('fixing bug in database code', ['debug']);
    assert.ok(context.includes('RELEVANT AGENT SKILLS & LEARNED PRACTICES'));
    assert.ok(context.includes('Systematic Debugging'));
  });
});

describe('Skills REST API Endpoints', () => {
  before(async () => {
    server = await startServer(0);
    port = server.address().port;
  });

  after(() => {
    if (server) server.close();
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  test('GET /api/skills returns all registered skills', async () => {
    const res = await request({ path: '/api/skills', method: 'GET' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(Array.isArray(json.skills));
    assert.ok(json.skills.length >= 3);
  });

  test('POST /api/skills/learn adds a new skill via API', async () => {
    const payload = {
      name: 'Zero Native Addon Rule',
      description: 'Strict pure-JS dependency checks for Android Termux compatibility',
      tags: ['termux', 'pure-js', 'compatibility'],
      instructions: '1. Check package.json dependencies for C++ bindings or node-gyp.'
    };

    const res = await request({ path: '/api/skills/learn', method: 'POST' }, payload);
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(json.ok);
    assert.equal(json.skill.name, 'Zero Native Addon Rule');
  });

  test('POST /api/skills/import-hermes imports from specified directory', async () => {
    const res = await request({ path: '/api/skills/import-hermes', method: 'POST' }, { path: testDir });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.data);
    assert.ok(json.ok);
    assert.ok(json.count >= 2);
  });
});
