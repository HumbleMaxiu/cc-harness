#!/usr/bin/env node
'use strict';

const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const { emitCodexSystemMessage, isCodexHookPayload, readLatestPlan } = require('./plan-persist-common');

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

  if (isCodexHookPayload(raw, 'Stop')) {
    emitCodexSystemMessage(message);
    process.exit(0);
  }

  process.stderr.write(message + '\n');
}

process.stdout.write(raw);
