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

// Try to find the skill file
const candidates = [
  path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), 'using-brainstorming', 'SKILL.md'),
  path.join(__dirname, '..', '..', 'using-brainstorming', 'SKILL.md'),
];

let skillContent = '';
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