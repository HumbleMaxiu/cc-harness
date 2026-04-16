#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(0, 'utf8');
const activeDir = path.join(process.cwd(), 'docs', 'exec-plans', 'active');

if (fs.existsSync(activeDir)) {
  const activePlans = fs.readdirSync(activeDir)
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .map((name) => {
      const abs = path.join(activeDir, name);
      const stat = fs.statSync(abs);
      return { name, abs, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (activePlans.length > 0) {
    const latest = activePlans[0];
    const content = fs.readFileSync(latest.abs, 'utf8');
    const remaining = (content.match(/- \[ \]/g) || []).length;
    const summary = remaining > 0
      ? `${latest.name} still has ${remaining} unchecked step(s).`
      : `${latest.name} has no remaining unchecked steps.`;
    process.stderr.write(`[PlanPersist] Stop check: ${summary} Confirm Run Trace and phase status before exit.\n`);
  }
}

process.stdout.write(raw);
