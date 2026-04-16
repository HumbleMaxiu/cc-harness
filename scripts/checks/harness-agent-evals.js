#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const runner = path.join(repoRoot, 'scripts', 'checks', 'harness-behavior-evals.js');
const fixtures = [
  'architect-plan-gate',
  'developer-tdd-handoff',
  'reviewer-blocking-feedback',
  'tester-entrypoint-degrade',
  'feedback-curator-memory-sync',
];

for (const fixture of fixtures) {
  const result = spawnSync(process.execPath, [runner, '--fixture', fixture], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('Harness agent evals passed.');
