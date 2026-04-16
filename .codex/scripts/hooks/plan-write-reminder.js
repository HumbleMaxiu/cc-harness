#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(0, 'utf8');
const activeDir = path.join(process.cwd(), 'docs', 'exec-plans', 'active');

if (fs.existsSync(activeDir)) {
  const activePlans = fs.readdirSync(activeDir).filter((name) => name.endsWith('.md') && name !== 'index.md');
  if (activePlans.length > 0) {
    process.stderr.write('[PlanPersist] Write detected. If phase, scope, blockers, or touched files changed, update Run Trace / Skill Workflow Record.\n');
  }
}

process.stdout.write(raw);
