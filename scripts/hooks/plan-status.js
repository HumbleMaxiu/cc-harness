#!/usr/bin/env node
'use strict';

const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const repoRoot = process.cwd();
const { emitCodexAdditionalContext, isCodexHookPayload, preview, readLatestPlan } = require('./plan-persist-common');

const latest = readLatestPlan(repoRoot);
if (!latest) {
  if (!isCodexHookPayload(raw, 'UserPromptSubmit')) {
    process.stdout.write(raw);
  }
  process.exit(0);
}

const statusBlock = [
  '<PLAN_STATUS>',
  `active_plan: ${latest.relPath}`,
  `drift_status: ${latest.driftStatus}`,
  `drift_signals: ${latest.driftSignals.length > 0 ? latest.driftSignals.join(', ') : 'none'}`,
  `pending_operation_gate: ${latest.pendingOperationGate}`,
  '',
  'plan_preview:',
  preview(latest.content, 24),
  '',
  'run_trace_preview:',
  latest.runTracePreview,
  '</PLAN_STATUS>',
].join('\n');

if (isCodexHookPayload(raw, 'UserPromptSubmit')) {
  emitCodexAdditionalContext('UserPromptSubmit', statusBlock);
  process.exit(0);
}

process.stdout.write(raw + '\n' + statusBlock + '\n');
