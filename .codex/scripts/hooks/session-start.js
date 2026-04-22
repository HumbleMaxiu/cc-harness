#!/usr/bin/env node
'use strict';

/**
 * session-start.js
 */

const fs = require('fs');
const path = require('path');
const { emitJson, logHook, readHookInput } = require('./codex-hook-common');

const { parsed } = readHookInput();
logHook('SessionStart', 'session-start hook execution started');

if (!parsed || parsed.hook_event_name !== 'SessionStart') {
  logHook('SessionStart', 'skipping session-start hook', {
    reason: !parsed ? 'missing-or-invalid-payload' : 'non-session-start-event',
    event: parsed && parsed.hook_event_name,
  });
  process.exit(0);
}

let skillContent = '';
const candidates = [
  path.join(process.cwd(), '.codex', 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), '.claude', 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(process.cwd(), 'skills', 'using-brainstorming', 'SKILL.md'),
  path.join(__dirname, '..', '..', 'skills', 'using-brainstorming', 'SKILL.md'),
];
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    skillContent = fs.readFileSync(candidate, 'utf8');
    logHook('SessionStart', 'resolved using-brainstorming skill source', { candidate });
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
  injections.push(`<SKILL>\n${skillContent}\n</SKILL>`);
}

if (memoryBlocks) {
  injections.push(`<MEMORY>\n${memoryBlocks}\n</MEMORY>`);
}

if (!injections.length) {
  logHook('SessionStart', 'no session-start context available; skipping output');
  process.exit(0);
}

const additionalContext = injections.join('\n\n');

logHook('SessionStart', 'prepared session-start additional context', {
  source: parsed.source,
  hasSkill: skillContent ? 'true' : 'false',
  memoryFileCount: memoryBlocks ? memoryBlocks.split('<FILE path=').length - 1 : 0,
});

emitJson({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext,
  },
});
