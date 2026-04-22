#!/usr/bin/env node
'use strict';

const { emitJson, logHook, readHookInput, readLatestPlan } = require('./codex-hook-common');

const { parsed } = readHookInput();
logHook('PostToolUse', 'hook execution started');

if (!parsed || parsed.hook_event_name !== 'PostToolUse' || parsed.tool_name !== 'Bash') {
  logHook('PostToolUse', 'skipping hook', {
    reason: !parsed
      ? 'missing-or-invalid-payload'
      : parsed.hook_event_name !== 'PostToolUse'
        ? 'non-post-tool-use-event'
        : 'non-bash-tool',
    event: parsed && parsed.hook_event_name,
    tool: parsed && parsed.tool_name,
  });
  process.exit(0);
}

const latest = readLatestPlan(process.cwd());
if (!latest) {
  logHook('PostToolUse', 'skipping hook because no active plan is available');
  process.exit(0);
}

const signalSummary = latest.driftSignals.length > 0
  ? ` Current drift signals: ${latest.driftSignals.join(', ')}.`
  : '';
const systemMessage =
  '[PlanPersist] Write detected. If phase, scope, blockers, touched files, or drift signal status changed, update Run Trace / Skill Workflow Record.' +
  signalSummary;

logHook('PostToolUse', 'prepared reminder message', {
  plan: latest.name,
  uncheckedSteps: latest.uncheckedSteps,
  driftSignals: latest.driftSignals.join(','),
});

emitJson({
  systemMessage,
});
