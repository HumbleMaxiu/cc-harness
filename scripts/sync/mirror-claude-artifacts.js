#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const ignoredNames = new Set(['.DS_Store']);

const mirrorPairs = [
  ['.claude/skills', 'skills'],
  ['.claude/skills', '.codex/skills'],
  ['.claude/agents', 'agents'],
  ['.claude/agents', '.codex/agents'],
  ['.claude/scripts/hooks', 'scripts/hooks'],
  ['.claude/scripts/hooks', '.codex/scripts/hooks'],
  ['hooks', '.claude/hooks'],
  ['hooks', '.codex/hooks'],
];

function rel(...segments) {
  return path.join(repoRoot, ...segments);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listEntries(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !ignoredNames.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function removeExtraEntries(sourceDir, targetDir, actions) {
  const sourceNames = new Set(listEntries(sourceDir).map((entry) => entry.name));

  for (const entry of listEntries(targetDir)) {
    const targetPath = path.join(targetDir, entry.name);
    if (sourceNames.has(entry.name)) continue;

    fs.rmSync(targetPath, { recursive: true, force: true });
    actions.push(`removed ${path.relative(repoRoot, targetPath)}`);
  }
}

function syncDirectory(sourceDir, targetDir, actions) {
  ensureDir(targetDir);
  removeExtraEntries(sourceDir, targetDir, actions);

  for (const entry of listEntries(sourceDir)) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      syncDirectory(sourcePath, targetPath, actions);
      continue;
    }

    const sourceContent = fs.readFileSync(sourcePath);
    const targetExists = fs.existsSync(targetPath);
    const targetContent = targetExists ? fs.readFileSync(targetPath) : null;

    if (!targetExists || !sourceContent.equals(targetContent)) {
      ensureDir(path.dirname(targetPath));
      fs.copyFileSync(sourcePath, targetPath);
      actions.push(`${targetExists ? 'updated' : 'created'} ${path.relative(repoRoot, targetPath)}`);
    }
  }
}

function main() {
  const actions = [];

  for (const [sourceRel, targetRel] of mirrorPairs) {
    syncDirectory(rel(sourceRel), rel(targetRel), actions);
  }

  if (actions.length === 0) {
    console.log('Mirror sync: already up to date.');
    return;
  }

  console.log('Mirror sync completed:');
  for (const action of actions) {
    console.log(`- ${action}`);
  }
}

main();
