#!/usr/bin/env node
'use strict';

const { emitJson, logHook, readHookInput, readLatestPlan } = require('./codex-hook-common');

const { parsed } = readHookInput();
logHook('UserPromptSubmit', 'plan-status hook execution started');

if (!parsed || parsed.hook_event_name !== 'UserPromptSubmit') {
  logHook('UserPromptSubmit', 'skipping plan-status hook', {
    reason: !parsed ? 'missing-or-invalid-payload' : 'non-user-prompt-submit-event',
    event: parsed && parsed.hook_event_name,
  });
  process.exit(0);
}

const latest = readLatestPlan(process.cwd());
if (!latest) {
  logHook('UserPromptSubmit', 'no active plan found; skipping plan-status hook');
  process.exit(0);
}

const additionalContext = [
  '<PLAN_STATUS>',
  `active_plan: ${latest.name}`,
  `unchecked_steps: ${latest.uncheckedSteps}`,
  `drift_signals: ${latest.driftSignals.length > 0 ? latest.driftSignals.join(', ') : 'none'}`,
  `pending_operation_gate: ${latest.pendingOperationGate}`,
  '</PLAN_STATUS>',
].join('\n');

logHook('UserPromptSubmit', 'prepared plan-status additional context', {
  plan: latest.name,
  uncheckedSteps: latest.uncheckedSteps,
  driftSignals: latest.driftSignals.join(','),
  pendingOperationGate: latest.pendingOperationGate,
});

emitJson({
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit',
    additionalContext,
  },
});
