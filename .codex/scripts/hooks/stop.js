#!/usr/bin/env node
'use strict';

const { emitJson, logHook, readHookInput, readLatestPlan } = require('./codex-hook-common');

const { parsed } = readHookInput();
logHook('Stop', 'hook execution started');

if (!parsed || parsed.hook_event_name !== 'Stop') {
  logHook('Stop', 'skipping hook', {
    reason: !parsed ? 'missing-or-invalid-payload' : 'non-stop-event',
    event: parsed && parsed.hook_event_name,
  });
  emitJson({});
  process.exit(0);
}

const latest = readLatestPlan(process.cwd());
if (!latest) {
  logHook('Stop', 'no active plan found; emitting empty payload');
  emitJson({});
  process.exit(0);
}

const stepSummary = latest.uncheckedSteps > 0
  ? `${latest.name} still has ${latest.uncheckedSteps} unchecked step(s).`
  : `${latest.name} has no remaining unchecked steps.`;
const driftSummary = latest.driftSignals.length > 0
  ? ` unresolved drift: ${latest.driftSignals.join(', ')}.`
  : ' unresolved drift: none.';
const gateSummary = latest.pendingOperationGate === 'true'
  ? ' A pending operation gate still exists.'
  : '';
const systemMessage =
  `[PlanPersist] Stop check: ${stepSummary}${driftSummary}${gateSummary} Confirm Run Trace and phase status before exit.`;

logHook('Stop', 'prepared stop summary', {
  plan: latest.name,
  uncheckedSteps: latest.uncheckedSteps,
  driftSignals: latest.driftSignals.join(','),
  pendingOperationGate: latest.pendingOperationGate,
});

emitJson({
  systemMessage,
});
