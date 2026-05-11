#!/usr/bin/env node
'use strict';

/**
 * session-start.js
 *
 * SessionStart hook - injects the using-brainstorming skill plus a minimal project memory snapshot into new sessions.
 */

const fs = require('fs');
const path = require('path');
const { emitCodexAdditionalContext, isCodexHookPayload } = require('./plan-persist-common');

const raw = fs.readFileSync(0, 'utf8');

let skillContent = '';
const candidates = [
  path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), '.claude', 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), '.codex', 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), 'using-brainstorming', 'SKILL.md'),
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
  if (!isCodexHookPayload(raw, 'SessionStart')) {
    process.stdout.write(raw);
  }
  process.exit(0);
}

if (isCodexHookPayload(raw, 'SessionStart')) {
  emitCodexAdditionalContext('SessionStart', injections.join('\n'));
  process.exit(0);
}

process.stdout.write(raw + injections.join(''));
process.exit(0);
