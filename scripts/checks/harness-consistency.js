#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function fail(message) {
  failures.push(message);
}

function parseMarkdownLinks(content) {
  const links = [];
  const linkRegex = /\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function assertRelativeLinksExist(relPath) {
  const content = read(relPath);
  const baseDir = path.dirname(relPath);
  for (const link of parseMarkdownLinks(content)) {
    if (/^(https?:|mailto:)/.test(link)) continue;
    const target = path.normalize(path.join(baseDir, link));
    if (!exists(target)) {
      fail(`${relPath}: broken link -> ${link}`);
    }
  }
}

function listedMarkdownFiles(indexPath) {
  const content = read(indexPath);
  const files = new Set();
  const regex = /\[([^\]]+\.md)\]\(([^)]+\.md)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    files.add(path.basename(match[2]));
  }
  return files;
}

function actualMarkdownFiles(dirPath) {
  return fs.readdirSync(path.join(repoRoot, dirPath))
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .sort();
}

function assertIndexCoversDirectory(indexPath, dirPath) {
  const listed = listedMarkdownFiles(indexPath);
  for (const file of actualMarkdownFiles(dirPath)) {
    if (!listed.has(file)) {
      fail(`${indexPath}: missing entry for ${dirPath}/${file}`);
    }
  }
}

function assertExecPlanIndexMatches() {
  const index = read('docs/exec-plans/index.md');
  const activeFiles = actualMarkdownFiles('docs/exec-plans/active');
  const completedFiles = actualMarkdownFiles('docs/exec-plans/completed');

  for (const file of activeFiles) {
    if (!index.includes(`active/${file}`)) {
      fail(`docs/exec-plans/index.md: missing active entry for ${file}`);
    }
  }

  for (const file of completedFiles) {
    if (!index.includes(`completed/${file}`)) {
      fail(`docs/exec-plans/index.md: missing completed entry for ${file}`);
    }
  }

  if (activeFiles.length > 0 && index.includes('| 暂无 | — | — |')) {
    fail('docs/exec-plans/index.md: still contains 暂无 placeholder while active plans exist');
  }
}

function assertHookDocsMatchImplementation() {
  const feedbackDoc = read('docs/feedback/feedback-collection.md');
  const sessionStartHook = read('scripts/hooks/session-start.js');

  if (!sessionStartHook.includes('using-brainstorming')) {
    fail('scripts/hooks/session-start.js: expected using-brainstorming injection behavior');
  }

  if (feedbackDoc.includes('注入 `docs/memory/index.md`')) {
    fail('docs/feedback/feedback-collection.md: claims SessionStart injects memory docs, but implementation only injects using-brainstorming');
  }
}

function main() {
  const requiredPaths = [
    'AGENTS.md',
    'docs/design-docs/index.md',
    'docs/exec-plans/index.md',
    '.claude/agents/tester.md',
    'skills/dev-workflow/SKILL.md',
    '.claude/skills/dev-workflow/SKILL.md',
    'scripts/hooks/session-start.js',
  ];

  for (const relPath of requiredPaths) {
    if (!exists(relPath)) {
      fail(`missing required path: ${relPath}`);
    }
  }

  assertRelativeLinksExist('AGENTS.md');
  assertRelativeLinksExist('docs/design-docs/index.md');
  assertRelativeLinksExist('docs/exec-plans/index.md');
  assertRelativeLinksExist('docs/product-specs/index.md');

  assertIndexCoversDirectory('docs/design-docs/index.md', 'docs/design-docs');
  assertIndexCoversDirectory('docs/product-specs/index.md', 'docs/product-specs');
  assertExecPlanIndexMatches();
  assertHookDocsMatchImplementation();

  if (failures.length > 0) {
    console.error('Harness consistency check failed:\n');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Harness consistency check passed.');
}

main();
