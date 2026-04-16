#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function listActivePlans(repoRoot) {
  const activeDir = path.join(repoRoot, 'docs', 'exec-plans', 'active');
  if (!fs.existsSync(activeDir)) {
    return [];
  }

  return fs.readdirSync(activeDir)
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .map((name) => {
      const abs = path.join(activeDir, name);
      const stat = fs.statSync(abs);
      return { name, abs, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function extractSection(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`${escaped}[\\s\\S]*?(?=\\n### |\\n## |\\n# |$)`));
  return match ? match[0].trim() : '';
}

function extractField(section, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = section.match(new RegExp(`- ${escaped}:\\s*(.*)`));
  return match ? match[1].trim() : '';
}

function preview(content, lines) {
  return content.trim().split('\n').slice(0, lines).join('\n');
}

function detectDriftSignals(content) {
  const signals = [];
  const runTrace = extractSection(content, '### Run Trace');
  const planDrift = extractSection(content, '### Plan Drift');
  const operationGate = extractSection(content, '### Operation Gate');
  const finalSummary = extractSection(content, '### Final Summary');

  if (!runTrace) {
    signals.push('missing-run-trace');
  } else if (!extractField(runTrace, 'plan_path')) {
    signals.push('missing-plan-path');
  }

  const gatePending = extractField(operationGate, 'confirmation_status') === 'pending';
  if (gatePending) {
    signals.push('pending-operation-gate');
  }

  const driftDetected = extractField(planDrift, 'drift_detected') === 'true';
  const resolvedBy = extractField(planDrift, 'resolved_by');
  const driftStatus = extractField(finalSummary, 'plan_drift_status');
  const unresolvedDrift = (driftDetected && !resolvedBy) || /unresolved|pending|open/.test(driftStatus);
  if (unresolvedDrift) {
    signals.push('unresolved-plan-drift');
  }

  return {
    driftStatus: signals.length > 0 ? 'attention-needed' : 'clear',
    driftSignals: signals,
    pendingOperationGate: gatePending ? 'true' : 'false',
    runTracePreview: runTrace ? preview(runTrace, 12) : 'none recorded in current active plan',
  };
}

function readLatestPlan(repoRoot) {
  const plans = listActivePlans(repoRoot);
  if (plans.length === 0) {
    return null;
  }

  const latest = plans[0];
  const content = fs.readFileSync(latest.abs, 'utf8');
  const relPath = path.relative(repoRoot, latest.abs);
  return {
    name: latest.name,
    abs: latest.abs,
    relPath,
    content,
    uncheckedSteps: (content.match(/- \[ \]/g) || []).length,
    ...detectDriftSignals(content),
  };
}

module.exports = {
  listActivePlans,
  preview,
  readLatestPlan,
};
