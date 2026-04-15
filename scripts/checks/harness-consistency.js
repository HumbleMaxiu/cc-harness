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

function readJson(relPath) {
  return JSON.parse(read(relPath));
}

function listFilesRecursive(relDir) {
  const base = path.join(repoRoot, relDir);
  const files = [];

  function walk(currentDir, currentRel = '') {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name === '__pycache__') continue;
      const nextRel = currentRel ? path.join(currentRel, entry.name) : entry.name;
      const nextAbs = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextAbs, nextRel);
      } else if (entry.isFile()) {
        files.push(nextRel);
      }
    }
  }

  if (!fs.existsSync(base)) {
    return files;
  }

  walk(base);
  return files.sort();
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

function assertClaudeMarketplaceManifest() {
  const plugin = readJson('.claude-plugin/plugin.json');
  const marketplace = readJson('.claude-plugin/marketplace.json');
  const assertHttpsUrl = (value, label) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      fail(`${label} must be a non-empty URL string`);
      return;
    }

    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      fail(`${label} must be a valid URL`);
      return;
    }

    if (parsed.protocol !== 'https:') {
      fail(`${label} must use https`);
    }
  };

  if (!Array.isArray(plugin.agents) || plugin.agents.length === 0) {
    fail('.claude-plugin/plugin.json: agents must be a non-empty array');
  }

  if (!Array.isArray(plugin.skills) || !plugin.skills.includes('./skills/')) {
    fail('.claude-plugin/plugin.json: skills must include ./skills/');
  }

  if (!Array.isArray(plugin.commands)) {
    fail('.claude-plugin/plugin.json: commands must be an array');
  }

  assertHttpsUrl(plugin.homepage, '.claude-plugin/plugin.json: homepage');
  assertHttpsUrl(plugin.repository, '.claude-plugin/plugin.json: repository');

  for (const relPath of plugin.agents) {
    const normalized = relPath.replace(/^\.\//, '');
    if (!exists(normalized)) {
      fail(`.claude-plugin/plugin.json: missing agent path ${relPath}`);
    }
  }

  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail('.claude-plugin/marketplace.json: plugins must be a non-empty array');
    return;
  }

  const primaryPlugin = marketplace.plugins[0];
  if (primaryPlugin.name !== plugin.name) {
    fail('.claude-plugin/marketplace.json: first plugin entry name must match .claude-plugin/plugin.json');
  }

  if (primaryPlugin.source !== './') {
    fail('.claude-plugin/marketplace.json: first plugin entry source must be ./');
  }

  assertHttpsUrl(primaryPlugin.homepage, '.claude-plugin/marketplace.json: first plugin entry homepage');
  assertHttpsUrl(primaryPlugin.repository, '.claude-plugin/marketplace.json: first plugin entry repository');
}

function assertAutonomousWorkflowDocs() {
  const workflow = read('skills/dev-workflow/SKILL.md');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const feedbackDoc = read('docs/feedback/feedback-collection.md');
  const memoryDoc = read('docs/memory/feedback/agent-feedback.md');

  const forbiddenSnippets = [
    '立即询问用户是否修复后继续',
    '未经用户确认不得自动回到实现',
    '未经用户确认，不得因为 Agent 反馈自动触发新的实现改动。',
  ];

  for (const snippet of forbiddenSnippets) {
    if (workflow.includes(snippet)) {
      fail(`skills/dev-workflow/SKILL.md: stale pre-autonomous rule -> ${snippet}`);
    }
  }

  if (!workflow.includes('最终交付前统一向用户汇总')) {
    fail('skills/dev-workflow/SKILL.md: expected final-gate summary behavior');
  }

  if (!agentSpec.includes('最终交付前统一向用户汇总')) {
    fail('docs/product-specs/agent-system.md: expected final-gate summary behavior');
  }

  if (!feedbackDoc.includes('自动修复')) {
    fail('docs/feedback/feedback-collection.md: expected auto-remediation guidance');
  }

  if (!memoryDoc.includes('自动执行')) {
    fail('docs/memory/feedback/agent-feedback.md: expected autonomous feedback record fields');
  }

  if (!workflow.includes('自动执行白名单')) {
    fail('skills/dev-workflow/SKILL.md: expected risk-based auto-apply policy');
  }

  if (!memoryDoc.includes('pattern') || !memoryDoc.includes('rule')) {
    fail('docs/memory/feedback/agent-feedback.md: expected generalized rule-oriented feedback fields');
  }

  if (!feedbackDoc.includes('不要直接把 lint / test 原始文本写进长期 memory')) {
    fail('docs/feedback/feedback-collection.md: expected generalized-memory guidance');
  }
}

function assertDangerousModeSettingsDocs() {
  const requiredSetting = '"skipDangerousModePermissionPrompt": true';
  const readme = read('README.md');
  const agentsDoc = read('AGENTS.md');
  const projectSettings = read('examples/claude-code/project-settings.json');
  const globalSettings = read('examples/claude-code/global-settings.json');
  const claudeSettings = read('.claude/settings.json');
  const codexSettings = read('.codex/settings.json');

  if (!readme.includes('skipDangerousModePermissionPrompt')) {
    fail('README.md: expected dangerous mode setting guidance');
  }

  if (!agentsDoc.includes('skipDangerousModePermissionPrompt')) {
    fail('AGENTS.md: expected dangerous mode setting guidance');
  }

  for (const [relPath, content] of [
    ['examples/claude-code/project-settings.json', projectSettings],
    ['examples/claude-code/global-settings.json', globalSettings],
    ['.claude/settings.json', claudeSettings],
    ['.codex/settings.json', codexSettings],
  ]) {
    if (!content.includes(requiredSetting)) {
      fail(`${relPath}: missing ${requiredSetting}`);
    }
  }
}

function assertMirrorDirectory(sourceDir, mirrorDir) {
  const sourceFiles = listFilesRecursive(sourceDir);
  const mirrorFiles = listFilesRecursive(mirrorDir);
  const sourceSet = new Set(sourceFiles);
  const mirrorSet = new Set(mirrorFiles);

  for (const relPath of sourceFiles) {
    if (!mirrorSet.has(relPath)) {
      fail(`${mirrorDir}: missing mirrored file ${relPath} from ${sourceDir}`);
      continue;
    }

    const sourceContent = read(path.join(sourceDir, relPath));
    const mirrorContent = read(path.join(mirrorDir, relPath));
    if (sourceContent !== mirrorContent) {
      fail(`${mirrorDir}: content drift for ${relPath} (expected to match ${sourceDir})`);
    }
  }

  for (const relPath of mirrorFiles) {
    if (!sourceSet.has(relPath)) {
      fail(`${mirrorDir}: unexpected extra file ${relPath} not present in ${sourceDir}`);
    }
  }
}

function main() {
  const requiredPaths = [
    'AGENTS.md',
    'README.md',
    'agents/architect.md',
    'agents/feedback-curator.md',
    'docs/design-docs/index.md',
    'docs/exec-plans/index.md',
    'docs/exec-plans/completed/2026-04-15-claude-marketplace-install.md',
    '.claude/agents/tester.md',
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    '.claude/hooks/hooks.json',
    '.codex/hooks/hooks.json',
    '.codex/agents/feedback-curator.md',
    'examples/claude-code/project-settings.json',
    'examples/claude-code/global-settings.json',
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
  assertRelativeLinksExist('README.md');
  assertRelativeLinksExist('ARCHITECTURE.md');
  assertRelativeLinksExist('docs/design-docs/index.md');
  assertRelativeLinksExist('docs/exec-plans/index.md');
  assertRelativeLinksExist('docs/product-specs/index.md');

  assertIndexCoversDirectory('docs/design-docs/index.md', 'docs/design-docs');
  assertIndexCoversDirectory('docs/product-specs/index.md', 'docs/product-specs');
  assertExecPlanIndexMatches();
  assertHookDocsMatchImplementation();
  assertClaudeMarketplaceManifest();
  assertAutonomousWorkflowDocs();
  assertDangerousModeSettingsDocs();
  assertMirrorDirectory('.claude/skills', 'skills');
  assertMirrorDirectory('.claude/skills', '.codex/skills');
  assertMirrorDirectory('.claude/agents', 'agents');
  assertMirrorDirectory('.claude/agents', '.codex/agents');
  assertMirrorDirectory('.claude/scripts/hooks', 'scripts/hooks');
  assertMirrorDirectory('.claude/scripts/hooks', '.codex/scripts/hooks');
  assertMirrorDirectory('hooks', '.claude/hooks');
  assertMirrorDirectory('hooks', '.codex/hooks');

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
