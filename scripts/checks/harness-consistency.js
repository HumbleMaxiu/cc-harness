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
      if (entry.name === '__pycache__' || entry.name === '.DS_Store') continue;
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
  const expectedMemoryFiles = [
    'docs/memory/index.md',
    'docs/memory/feedback/prevents-recurrence.md',
    'docs/memory/feedback/user-feedback.md',
    'docs/memory/feedback/agent-feedback.md',
  ];

  if (!sessionStartHook.includes('using-brainstorming')) {
    fail('scripts/hooks/session-start.js: expected using-brainstorming injection behavior');
  }

  if (!sessionStartHook.includes('const memoryFiles = [')) {
    fail('scripts/hooks/session-start.js: expected explicit memoryFiles injection list');
  }

  for (const memoryFile of expectedMemoryFiles) {
    if (!sessionStartHook.includes(memoryFile)) {
      fail(`scripts/hooks/session-start.js: missing memory injection target ${memoryFile}`);
    }
  }

  if (!feedbackDoc.includes('SessionStart hook 当前会注入 `using-brainstorming` skill')) {
    fail('docs/feedback/feedback-collection.md: expected session-start skill injection guidance');
  }

  if (!feedbackDoc.includes('也会附带 `docs/memory/index.md`')) {
    fail('docs/feedback/feedback-collection.md: expected session-start memory injection guidance');
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

function assertFeedbackArchiveDocs() {
  const memoryIndex = read('docs/memory/index.md');
  const feedbackDoc = read('docs/feedback/feedback-collection.md');
  const agentMemory = read('docs/memory/feedback/agent-feedback.md');
  const archiveIndex = read('docs/memory/feedback/archive/index.md');
  const archiveMonth = read('docs/memory/feedback/archive/2026-04.md');
  const curatorAgent = read('agents/feedback-curator.md');
  const fileSpecs = read('skills/harness-setup/references/file-specs.md');

  if (!memoryIndex.includes('feedback/archive/')) {
    fail('docs/memory/index.md: expected feedback archive reference');
  }

  if (!feedbackDoc.includes('docs/memory/feedback/archive/YYYY-MM.md')) {
    fail('docs/feedback/feedback-collection.md: expected feedback rollup/archive guidance');
  }

  if (!agentMemory.includes('roll up 到 `docs/memory/feedback/archive/YYYY-MM.md`')) {
    fail('docs/memory/feedback/agent-feedback.md: expected active-memory rollup guidance');
  }

  if (!archiveIndex.includes('月度归档')) {
    fail('docs/memory/feedback/archive/index.md: expected monthly archive guidance');
  }

  if (!archiveMonth.includes('固定输出格式')) {
    fail('docs/memory/feedback/archive/2026-04.md: expected fixed monthly rollup format guidance');
  }

  if (!archiveMonth.includes('feedback 直接记录一次性错误文本')) {
    fail('docs/memory/feedback/archive/2026-04.md: expected sample rollup record');
  }

  if (!curatorAgent.includes('docs/feedback/feedback-collection.md')) {
    fail('agents/feedback-curator.md: expected explicit feedback-collection read requirement');
  }

  if (!fileSpecs.includes('docs/feedback/feedback-collection.md')) {
    fail('skills/harness-setup/references/file-specs.md: expected generated feedback-collection doc spec');
  }

  if (!fileSpecs.includes('docs/memory/feedback/archive/YYYY-MM.md')) {
    fail('skills/harness-setup/references/file-specs.md: expected generated feedback archive spec');
  }
}

function assertHarnessSetupCoverage() {
  const harnessSetup = read('skills/harness-setup/SKILL.md');
  const behaviorRules = read('skills/harness-setup/references/behavior-rules.md');
  const harnessSpec = read('docs/product-specs/harness-engineering.md');
  const fileSpecs = read('skills/harness-setup/references/file-specs.md');

  if (!harnessSetup.includes('feedback/feedback-collection.md')) {
    fail('skills/harness-setup/SKILL.md: expected scaffold coverage for docs/feedback/feedback-collection.md');
  }

  if (!harnessSetup.includes('memory/feedback/archive/')) {
    fail('skills/harness-setup/SKILL.md: expected scaffold coverage for feedback archive directories');
  }

  if (behaviorRules.includes('执行前先征求用户同意')) {
    fail('skills/harness-setup/references/behavior-rules.md: stale pre-autonomous feedback rule');
  }

  if (!harnessSpec.includes('文档责任矩阵')) {
    fail('docs/product-specs/harness-engineering.md: expected document ownership matrix');
  }

  if (!harnessSpec.includes('项目级文档与任务级文档的边界')) {
    fail('docs/product-specs/harness-engineering.md: expected project-vs-task document boundary guidance');
  }

  if (!fileSpecs.includes('默认生成“工作流导航 + 路线图占位”')) {
    fail('skills/harness-setup/references/file-specs.md: expected non-random scaffold rule for PLANS.md');
  }

  if (!fileSpecs.includes('用户项目可运行的通用 harness 自检脚本')) {
    fail('skills/harness-setup/references/file-specs.md: expected generic user-facing harness consistency script spec');
  }

  if (!harnessSpec.includes('沉淀触发条件')) {
    fail('docs/product-specs/harness-engineering.md: expected promotion trigger guidance for project-level docs');
  }

  if (!harnessSetup.includes('skeleton-first')) {
    fail('skills/harness-setup/SKILL.md: expected skeleton-first scaffold guidance');
  }

  if (!fileSpecs.includes('Promote from：')) {
    fail('skills/harness-setup/references/file-specs.md: expected promote-from guidance for project-level docs');
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

function assertEvalCoverageDocs() {
  const packageJson = readJson('package.json');
  const qualityScore = read('docs/QUALITY_SCORE.md');
  const referencesIndex = read('docs/references/index.md');
  const evalScenarios = read('docs/references/eval-scenarios.md');

  if (!packageJson.scripts || packageJson.scripts['check:evals'] !== 'node scripts/checks/harness-evals.js') {
    fail('package.json: expected check:evals script');
  }

  if (!packageJson.scripts || typeof packageJson.scripts.test !== 'string' || !packageJson.scripts.test.includes('scripts/checks/harness-evals.js')) {
    fail('package.json: expected test script to include harness evals');
  }

  if (!referencesIndex.includes('eval-scenarios.md')) {
    fail('docs/references/index.md: expected eval scenario reference');
  }

  if (!qualityScore.includes('Harness eval check') && !qualityScore.includes('harness-evals.js')) {
    fail('docs/QUALITY_SCORE.md: expected eval signal source');
  }

  [
    '`skill-success-loop`',
    '`skill-plan-check-escalation`',
    '`skill-self-review-feedback-record`',
    '`skill-verification-uncertainty`',
  ].forEach((snippet) => {
    if (!evalScenarios.includes(snippet)) {
      fail(`docs/references/eval-scenarios.md: missing required scenario ${snippet}`);
    }
  });
}

function assertRiskModelDocs() {
  const security = read('docs/SECURITY.md');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const harnessSpec = read('docs/product-specs/harness-engineering.md');
  const workflow = read('skills/dev-workflow/SKILL.md');
  const reviewer = read('agents/reviewer.md');
  const tester = read('agents/tester.md');
  const curator = read('agents/feedback-curator.md');
  const feedbackDoc = read('docs/feedback/feedback-collection.md');
  const agentMemory = read('docs/memory/feedback/agent-feedback.md');

  const requiredLevels = ['read-only', 'reversible-write', 'irreversible-write', 'external-side-effect'];

  for (const level of requiredLevels) {
    if (!security.includes(level)) {
      fail(`docs/SECURITY.md: missing operation risk level ${level}`);
    }
    if (!agentSpec.includes(level)) {
      fail(`docs/product-specs/agent-system.md: missing operation risk level ${level}`);
    }
    if (!workflow.includes(level)) {
      fail(`skills/dev-workflow/SKILL.md: missing operation risk level ${level}`);
    }
  }

  if (!security.includes('### Operation Gate')) {
    fail('docs/SECURITY.md: expected Operation Gate template');
  }

  if (!harnessSpec.includes('### 用户输入到工具调用的约束模板')) {
    fail('docs/product-specs/harness-engineering.md: expected tool-call constraint template guidance');
  }

  if (!workflow.includes('operation_risk: read-only | reversible-write | irreversible-write | external-side-effect | none')) {
    fail('skills/dev-workflow/SKILL.md: expected Feedback Record operation_risk field');
  }

  if (!reviewer.includes('operation_risk: read-only | reversible-write | irreversible-write | external-side-effect | none')) {
    fail('agents/reviewer.md: expected operation_risk field');
  }

  if (!tester.includes('operation_risk: read-only | reversible-write | irreversible-write | external-side-effect | none')) {
    fail('agents/tester.md: expected operation_risk field');
  }

  if (!curator.includes('operation_risk')) {
    fail('agents/feedback-curator.md: expected operation_risk handling guidance');
  }

  if (!feedbackDoc.includes('operation_risk')) {
    fail('docs/feedback/feedback-collection.md: expected operation_risk guidance');
  }

  if (!agentMemory.includes('operation_risk')) {
    fail('docs/memory/feedback/agent-feedback.md: expected operation_risk field');
  }
}

function assertMirrorSyncTooling() {
  const packageJson = readJson('package.json');
  const readme = read('README.md');
  const qualityScore = read('docs/QUALITY_SCORE.md');

  if (!exists('scripts/sync/mirror-claude-artifacts.js')) {
    fail('missing required path: scripts/sync/mirror-claude-artifacts.js');
  }

  if (!packageJson.scripts || packageJson.scripts['sync:mirrors'] !== 'node scripts/sync/mirror-claude-artifacts.js') {
    fail('package.json: expected sync:mirrors script');
  }

  if (!readme.includes('npm run sync:mirrors')) {
    fail('README.md: expected mirror sync command guidance');
  }

  if (!qualityScore.includes('mirror-claude-artifacts.js')) {
    fail('docs/QUALITY_SCORE.md: expected mirror sync tooling signal');
  }
}

function assertRunTraceDocs() {
  const reliability = read('docs/RELIABILITY.md');
  const memoryIndex = read('docs/memory/index.md');
  const workflow = read('skills/dev-workflow/SKILL.md');
  const referencesIndex = read('docs/references/index.md');
  const runTraceProtocol = read('docs/references/run-trace-protocol.md');

  if (!referencesIndex.includes('run-trace-protocol.md')) {
    fail('docs/references/index.md: expected run trace protocol reference');
  }

  if (!reliability.includes('### Run Trace')) {
    fail('docs/RELIABILITY.md: expected run trace section');
  }

  if (!reliability.includes('### Resume Protocol')) {
    fail('docs/RELIABILITY.md: expected resume protocol section');
  }

  if (!memoryIndex.includes('与 Run Trace 的边界')) {
    fail('docs/memory/index.md: expected run trace boundary guidance');
  }

  if (!workflow.includes('## 运行轨迹与恢复')) {
    fail('skills/dev-workflow/SKILL.md: expected run trace section');
  }

  if (!workflow.includes('### Run Trace')) {
    fail('skills/dev-workflow/SKILL.md: expected run trace block');
  }

  if (!runTraceProtocol.includes('### Run Trace')) {
    fail('docs/references/run-trace-protocol.md: expected run trace template');
  }

  if (!runTraceProtocol.includes('## Resume Protocol')) {
    fail('docs/references/run-trace-protocol.md: expected resume protocol');
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
  assertRelativeLinksExist('docs/references/index.md');
  assertRelativeLinksExist('docs/references/eval-scenarios.md');

  assertIndexCoversDirectory('docs/design-docs/index.md', 'docs/design-docs');
  assertIndexCoversDirectory('docs/product-specs/index.md', 'docs/product-specs');
  assertExecPlanIndexMatches();
  assertHookDocsMatchImplementation();
  assertClaudeMarketplaceManifest();
  assertAutonomousWorkflowDocs();
  assertFeedbackArchiveDocs();
  assertHarnessSetupCoverage();
  assertDangerousModeSettingsDocs();
  assertEvalCoverageDocs();
  assertRiskModelDocs();
  assertMirrorSyncTooling();
  assertRunTraceDocs();
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
