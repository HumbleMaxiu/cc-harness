#!/usr/bin/env node
'use strict';

const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const repoRoot = process.cwd();
const { emitCodexSystemMessage, isCodexHookPayload, preview, readLatestPlan } = require('./plan-persist-common');

const latest = readLatestPlan(repoRoot);
if (!latest) {
  if (!isCodexHookPayload(raw, 'PreToolUse')) {
    process.stdout.write(raw);
  }
  process.exit(0);
}

const refreshBlock = [
  '<PLAN_REFRESH>',
  `active_plan: ${latest.relPath}`,
  'refresh_reason: re-anchor current phase before tool use',
  '',
  `drift_status: ${latest.driftStatus}`,
  `drift_signals: ${latest.driftSignals.length > 0 ? latest.driftSignals.join(', ') : 'none'}`,
  `pending_operation_gate: ${latest.pendingOperationGate}`,
  '',
  'plan_preview:',
  preview(latest.content, 18),
  '',
  'run_trace_preview:',
  latest.runTracePreview,
  '</PLAN_REFRESH>',
].join('\n');

if (isCodexHookPayload(raw, 'PreToolUse')) {
  emitCodexSystemMessage(refreshBlock);
  process.exit(0);
}

process.stdout.write(raw + '\n' + refreshBlock + '\n');
