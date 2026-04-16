#!/usr/bin/env node
'use strict';

const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const repoRoot = process.cwd();
const { preview, readLatestPlan } = require('./plan-persist-common');

const latest = readLatestPlan(repoRoot);
if (!latest) {
  process.stdout.write(raw);
  process.exit(0);
}

process.stdout.write(
  raw +
    '\n<PLAN_REFRESH>\n' +
    `active_plan: ${latest.relPath}\n` +
    'refresh_reason: re-anchor current phase before tool use\n\n' +
    `drift_status: ${latest.driftStatus}\n` +
    `drift_signals: ${latest.driftSignals.length > 0 ? latest.driftSignals.join(', ') : 'none'}\n` +
    `pending_operation_gate: ${latest.pendingOperationGate}\n\n` +
    'plan_preview:\n' +
    preview(latest.content, 18) +
    '\n\nrun_trace_preview:\n' +
    latest.runTracePreview +
    '\n</PLAN_REFRESH>\n'
);
