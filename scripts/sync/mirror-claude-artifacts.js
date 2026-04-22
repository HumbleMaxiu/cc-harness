#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const ignoredNames = new Set(['.DS_Store']);
const codexAgentProfiles = {
  architect: { model: 'gpt-5.4', reasoning: 'high', sandbox: 'workspace-write' },
  challenger: { model: 'gpt-5.4', reasoning: 'high', sandbox: 'read-only' },
  developer: { model: 'gpt-5.4', reasoning: 'medium', sandbox: 'workspace-write' },
  'feedback-curator': { model: 'gpt-5.4', reasoning: 'medium', sandbox: 'workspace-write' },
  reviewer: { model: 'gpt-5.4', reasoning: 'high', sandbox: 'read-only' },
  tester: { model: 'gpt-5.4', reasoning: 'medium', sandbox: 'workspace-write' },
};

const mirrorPairs = [
  ['.claude/skills', 'skills'],
  ['.claude/skills', '.codex/skills'],
  ['.claude/agents', 'agents'],
  ['.claude/scripts/hooks', 'scripts/hooks'],
  ['hooks', '.claude/hooks'],
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

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { body: markdown.trim() };
  }

  return { body: match[2].trim() };
}

function renderCodexAgentToml(agentName, sourceContent) {
  const profile = codexAgentProfiles[agentName];
  if (!profile) {
    throw new Error(`Missing Codex agent profile for ${agentName}`);
  }

  const { body } = parseFrontmatter(sourceContent);
  const instructions = body.replace(/\r\n/g, '\n').replace(/"""/g, '\\"""');

  return [
    `model = "${profile.model}"`,
    `model_reasoning_effort = "${profile.reasoning}"`,
    `sandbox_mode = "${profile.sandbox}"`,
    '',
    'developer_instructions = """',
    instructions,
    '"""',
    '',
  ].join('\n');
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

function syncCodexAgents(sourceDir, targetDir, actions) {
  ensureDir(targetDir);

  const sourceEntries = listEntries(sourceDir).filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  const expectedTargetNames = new Set(sourceEntries.map((entry) => entry.name.replace(/\.md$/, '.toml')));

  for (const entry of listEntries(targetDir)) {
    const targetPath = path.join(targetDir, entry.name);
    if (expectedTargetNames.has(entry.name)) continue;

    fs.rmSync(targetPath, { recursive: true, force: true });
    actions.push(`removed ${path.relative(repoRoot, targetPath)}`);
  }

  for (const entry of sourceEntries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const agentName = path.basename(entry.name, '.md');
    const targetPath = path.join(targetDir, `${agentName}.toml`);
    const rendered = Buffer.from(renderCodexAgentToml(agentName, fs.readFileSync(sourcePath, 'utf8')));
    const targetExists = fs.existsSync(targetPath);
    const targetContent = targetExists ? fs.readFileSync(targetPath) : null;

    if (!targetExists || !rendered.equals(targetContent)) {
      fs.writeFileSync(targetPath, rendered);
      actions.push(`${targetExists ? 'updated' : 'created'} ${path.relative(repoRoot, targetPath)}`);
    }
  }
}

function main() {
  const actions = [];

  for (const [sourceRel, targetRel] of mirrorPairs) {
    syncDirectory(rel(sourceRel), rel(targetRel), actions);
  }

  syncCodexAgents(rel('.claude/agents'), rel('.codex/agents'), actions);

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
