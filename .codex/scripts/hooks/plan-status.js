#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(0, 'utf8');
const repoRoot = process.cwd();

function listActivePlans() {
  const activeDir = path.join(repoRoot, 'docs', 'exec-plans', 'active');
  if (!fs.existsSync(activeDir)) {
    return [];
  }

  return fs.readdirSync(activeDir)
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .map((name) => {
      const abs = path.join(activeDir, name);
      const stat = fs.statSync(abs);
      return { abs, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function extractRunTrace(content) {
  const match = content.match(/### Run Trace[\s\S]*?(?=\n### |\n## |\n# |$)/);
  return match ? match[0].trim().split('\n').slice(0, 12).join('\n') : '';
}

function preview(content, lines) {
  return content.trim().split('\n').slice(0, lines).join('\n');
}

const plans = listActivePlans();
if (plans.length === 0) {
  process.stdout.write(raw);
  process.exit(0);
}

const current = plans[0];
const relPath = path.relative(repoRoot, current.abs);
const content = fs.readFileSync(current.abs, 'utf8');

process.stdout.write(
  raw +
    '\n<PLAN_STATUS>\n' +
    `active_plan: ${relPath}\n\n` +
    'plan_preview:\n' +
    preview(content, 24) +
    '\n\nrun_trace_preview:\n' +
    (extractRunTrace(content) || 'none recorded in current active plan') +
    '\n</PLAN_STATUS>\n'
);
