#!/usr/bin/env node
'use strict';

const { emitJson, logHook, readHookInput, readLatestPlan } = require('./codex-hook-common');

const { parsed } = readHookInput();
logHook('PreToolUse', 'plan-refresh hook execution started');

if (!parsed || parsed.hook_event_name !== 'PreToolUse' || parsed.tool_name !== 'Bash') {
  logHook('PreToolUse', 'skipping plan-refresh hook', {
    reason: !parsed
      ? 'missing-or-invalid-payload'
      : parsed.hook_event_name !== 'PreToolUse'
        ? 'non-pre-tool-use-event'
        : 'non-bash-tool',
    event: parsed && parsed.hook_event_name,
    tool: parsed && parsed.tool_name,
  });
  process.exit(0);
}

const latest = readLatestPlan(process.cwd());
if (!latest) {
  logHook('PreToolUse', 'no active plan found; skipping plan-refresh hook');
  process.exit(0);
}

const systemMessage =
  `[PlanPersist] Active plan ${latest.name}; re-anchor before running Bash. ` +
  `Unchecked steps: ${latest.uncheckedSteps}. ` +
  `Drift signals: ${latest.driftSignals.length > 0 ? latest.driftSignals.join(', ') : 'none'}. ` +
  `Pending operation gate: ${latest.pendingOperationGate}.`;

logHook('PreToolUse', 'prepared plan-refresh system message', {
  plan: latest.name,
  uncheckedSteps: latest.uncheckedSteps,
  driftSignals: latest.driftSignals.join(','),
  pendingOperationGate: latest.pendingOperationGate,
});

emitJson({
  systemMessage,
});
