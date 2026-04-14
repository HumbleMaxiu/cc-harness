#!/usr/bin/env node
'use strict';

/**
 * session-start.js
 *
 * ECC SessionStart hook - injects the using-brainstorming skill and project memory into new sessions.
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

function readOptional(filePath, maxChars) {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) {
    return '';
  }

  if (content.length <= maxChars) {
    return content;
  }

  return content.slice(0, maxChars) + '\n...[truncated]';
}

const memoryFiles = [
  ['docs/memory/index.md', 4000],
  ['docs/memory/feedback/prevents-recurrence.md', 4000],
  ['docs/memory/feedback/user-feedback.md', 3000],
  ['docs/memory/feedback/agent-feedback.md', 3000],
];

const memoryBlocks = memoryFiles
  .map(([relativePath, maxChars]) => {
    const absolutePath = path.join(process.cwd(), relativePath);
    const content = readOptional(absolutePath, maxChars);
    if (!content) {
      return '';
    }

    return `<FILE path="${relativePath}">\n${content}\n</FILE>`;
  })
  .filter(Boolean)
  .join('\n\n');

const injections = [];

if (skillContent) {
  injections.push(`\n<SKILL>\n${skillContent}\n</SKILL>\n`);
}

if (memoryBlocks) {
  injections.push(`\n<MEMORY>\n${memoryBlocks}\n</MEMORY>\n`);
}

if (!injections.length) {
  process.stdout.write(raw);
  process.exit(0);
}

// Output: pass through original plus all available injections.
process.stdout.write(raw + injections.join(''));
process.exit(0);
