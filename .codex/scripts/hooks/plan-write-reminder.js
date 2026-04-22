#!/usr/bin/env node
'use strict';

const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const { emitCodexSystemMessage, isCodexHookPayload, readLatestPlan } = require('./plan-persist-common');

const latest = readLatestPlan(process.cwd());
if (latest) {
  const signalSummary = latest.driftSignals.length > 0
    ? ` Current drift signals: ${latest.driftSignals.join(', ')}.`
    : '';
  const message =
    '[PlanPersist] Write detected. If phase, scope, blockers, touched files, or drift signal status changed, update Run Trace / Skill Workflow Record.' +
    signalSummary;

  if (isCodexHookPayload(raw, 'PostToolUse')) {
    emitCodexSystemMessage(message);
    process.exit(0);
  }

  process.stderr.write(message + '\n');
}

process.stdout.write(raw);
