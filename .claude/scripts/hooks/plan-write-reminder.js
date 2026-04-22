#!/usr/bin/env node
'use strict';

const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const {
  emitCodexSystemMessage,
  isCodexHookPayload,
  logHook,
  parseHookInput,
  readLatestPlan,
} = require('./plan-persist-common');

const parsed = parseHookInput(raw);
logHook('PostToolUse', 'plan-write-reminder started', {
  event: parsed && parsed.hook_event_name,
  tool: parsed && parsed.tool_name,
  bytes: Buffer.byteLength(raw || '', 'utf8'),
});

const latest = readLatestPlan(process.cwd());
if (latest) {
  const signalSummary = latest.driftSignals.length > 0
    ? ` Current drift signals: ${latest.driftSignals.join(', ')}.`
    : '';
  const message =
    '[PlanPersist] Write detected. If phase, scope, blockers, touched files, or drift signal status changed, update Run Trace / Skill Workflow Record.' +
    signalSummary;
  logHook('PostToolUse', 'prepared reminder message', {
    plan: latest.name,
    uncheckedSteps: latest.uncheckedSteps,
    driftSignals: latest.driftSignals.join(','),
  });

  if (isCodexHookPayload(raw, 'PostToolUse')) {
    logHook('PostToolUse', 'emitting Codex JSON reminder');
    emitCodexSystemMessage(message);
    process.exit(0);
  }

  logHook('PostToolUse', 'emitting Claude stderr reminder');
  process.stderr.write(message + '\n');
} else {
  logHook('PostToolUse', 'no active plan available; passthrough only');
}

process.stdout.write(raw);
