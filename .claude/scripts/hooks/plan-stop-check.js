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
logHook('Stop', 'plan-stop-check started', {
  event: parsed && parsed.hook_event_name,
  bytes: Buffer.byteLength(raw || '', 'utf8'),
});

const latest = readLatestPlan(process.cwd());
if (latest) {
  const stepSummary = latest.uncheckedSteps > 0
    ? `${latest.name} still has ${latest.uncheckedSteps} unchecked step(s).`
    : `${latest.name} has no remaining unchecked steps.`;
  const driftSummary = latest.driftSignals.length > 0
    ? ` unresolved drift: ${latest.driftSignals.join(', ')}.`
    : ' unresolved drift: none.';
  const gateSummary = latest.pendingOperationGate === 'true'
    ? ' A pending operation gate still exists.'
    : '';
  const message = `[PlanPersist] Stop check: ${stepSummary}${driftSummary}${gateSummary} Confirm Run Trace and phase status before exit.`;
  logHook('Stop', 'prepared stop summary', {
    plan: latest.name,
    uncheckedSteps: latest.uncheckedSteps,
    driftSignals: latest.driftSignals.join(','),
    pendingOperationGate: latest.pendingOperationGate,
  });

  if (isCodexHookPayload(raw, 'Stop')) {
    logHook('Stop', 'emitting Codex JSON stop summary');
    emitCodexSystemMessage(message);
    process.exit(0);
  }

  logHook('Stop', 'emitting Claude stderr stop summary');
  process.stderr.write(message + '\n');
} else {
  logHook('Stop', 'no active plan available; passthrough only');
}

process.stdout.write(raw);
