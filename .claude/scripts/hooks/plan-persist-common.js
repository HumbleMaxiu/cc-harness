#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

let cachedHookLogPath;

function parseHookInput(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function safeStat(target) {
  try {
    return fs.statSync(target);
  } catch {
    return null;
  }
}

function findClaudeRoot(startDir) {
  let current = path.resolve(startDir || process.cwd());

  while (true) {
    const claudeDir = path.join(current, '.claude');
    const stat = safeStat(claudeDir);
    if (stat && stat.isDirectory()) {
      return claudeDir;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function readHookLoggingConfig(claudeRoot) {
  if (!claudeRoot) {
    return null;
  }

  const configPath = path.join(claudeRoot, 'hook-logging.json');
  const stat = safeStat(configPath);
  if (!stat || !stat.isFile()) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function resolveHookLogPath() {
  if (cachedHookLogPath !== undefined) {
    return cachedHookLogPath;
  }

  const explicit = String(process.env.CC_HARNESS_HOOK_LOG_PATH || '').trim();
  if (explicit) {
    cachedHookLogPath = path.resolve(explicit);
    return cachedHookLogPath;
  }

  const claudeRoot = findClaudeRoot(process.cwd());
  const config = readHookLoggingConfig(claudeRoot);
  if (!config || config.enabled !== true) {
    cachedHookLogPath = null;
    return cachedHookLogPath;
  }

  const configuredPath = typeof config.logPath === 'string' ? config.logPath.trim() : '';
  const defaultPath = path.join('logs', 'hooks.log');
  cachedHookLogPath = claudeRoot
    ? path.resolve(claudeRoot, configuredPath || defaultPath)
    : null;
  return cachedHookLogPath;
}

function writeFileLogLine(line) {
  const logPath = resolveHookLogPath();
  if (!logPath) {
    return;
  }

  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line + '\n');
  } catch {
    // Best-effort logging only; hooks must remain fail-open.
  }
}

function writeStderrLine(line) {
  try {
    process.stderr.write(line + '\n');
  } catch {
    // Best-effort logging only; hooks must remain fail-open.
  }
}

function logHook(stage, message, details) {
  const detailKeys = details && typeof details === 'object'
    ? Object.keys(details).filter((key) => details[key] != null && details[key] !== '')
    : [];
  const detailSuffix = detailKeys.length > 0
    ? ' ' + JSON.stringify(detailKeys.reduce((acc, key) => {
      acc[key] = details[key];
      return acc;
    }, {}))
    : '';

  const line = `[claude-hook] ${new Date().toISOString()} ${stage} ${message}${detailSuffix}`;
  writeStderrLine(line);
  writeFileLogLine(line);
}

function isCodexHookPayload(raw, expectedEventName) {
  const parsed = parseHookInput(raw);
  if (!parsed || typeof parsed.hook_event_name !== 'string') {
    return false;
  }

  if (!expectedEventName) {
    return true;
  }

  return parsed.hook_event_name === expectedEventName;
}

function emitCodexSystemMessage(message, options = {}) {
  const payload = {
    systemMessage: message,
  };

  if (options.hookSpecificOutput) {
    payload.hookSpecificOutput = options.hookSpecificOutput;
  }

  process.stdout.write(JSON.stringify(payload));
}

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
    logHook('plan', 'no active exec plan found', { repoRoot });
    return null;
  }

  const latest = plans[0];
  const content = fs.readFileSync(latest.abs, 'utf8');
  const relPath = path.relative(repoRoot, latest.abs);
  const planState = {
    name: latest.name,
    abs: latest.abs,
    relPath,
    content,
    uncheckedSteps: (content.match(/- \[ \]/g) || []).length,
    ...detectDriftSignals(content),
  };
  logHook('plan', 'loaded latest active plan', {
    plan: planState.name,
    relPath: planState.relPath,
    uncheckedSteps: planState.uncheckedSteps,
    driftSignals: planState.driftSignals.join(','),
    pendingOperationGate: planState.pendingOperationGate,
  });
  return planState;
}

module.exports = {
  emitCodexSystemMessage,
  isCodexHookPayload,
  listActivePlans,
  logHook,
  parseHookInput,
  preview,
  readLatestPlan,
};
