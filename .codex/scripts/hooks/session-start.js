#!/usr/bin/env node
'use strict';

/**
 * session-start.js
 *
 * ECC SessionStart hook - injects the using-brainstorming skill into new sessions.
 */

const fs = require('fs');
const path = require('path');

// Read stdin
const raw = fs.readFileSync(0, 'utf8');

let skillContent = '';
const candidates = [
  // 1. CLAUDE_PLUGIN_ROOT/skills/ (对应 .claude/skills/ 布局，最优先)
  path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'skills', 'using-brainstorming', 'SKILL.md'),
  // 2. CLAUDE_PLUGIN_ROOT 直接 (旧路径兜底)
  path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'using-brainstorming', 'SKILL.md'),
  // 3. 项目本地 .claude/skills/
  path.join(process.cwd(), '.claude', 'skills', 'using-brainstorming', 'SKILL.md'),
  // 4. 项目本地根路径
  path.join(process.cwd(), 'using-brainstorming', 'SKILL.md'),
  // 5. __dirname 回溯 (scripts/hooks/ → 项目根目录)
  path.join(__dirname, '..', '..', 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(__dirname, '..', '..', 'using-brainstorming', 'SKILL.md'),
];
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    skillContent = fs.readFileSync(candidate, 'utf8');
    break;
  }
}

if (!skillContent) {
  // Skill file not found, pass through unchanged
  process.stdout.write(raw);
  process.exit(0);
}

// Inject skill content - for SessionStart, we prepend to system prompt via skill injection
// The skill content is output as a skill directive that gets prepended to the session
const skillInjection = `\n<SKILL>\n${skillContent}\n</SKILL>\n`;

// Output: pass through original + skill injection
process.stdout.write(raw + skillInjection);
process.exit(0);