#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const failures = [];
const codexAgentProfiles = {
  architect: { model: 'gpt-5.4', reasoning: 'high', sandbox: 'workspace-write' },
  challenger: { model: 'gpt-5.4', reasoning: 'high', sandbox: 'read-only' },
  developer: { model: 'gpt-5.4', reasoning: 'medium', sandbox: 'workspace-write' },
  'feedback-curator': { model: 'gpt-5.4', reasoning: 'medium', sandbox: 'workspace-write' },
  reviewer: { model: 'gpt-5.4', reasoning: 'high', sandbox: 'read-only' },
  tester: { model: 'gpt-5.4', reasoning: 'medium', sandbox: 'workspace-write' },
};

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
    fail(`missing codex profile for agent ${agentName}`);
    return '';
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
  const agentsTemplate = read('skills/harness-setup/templates/AGENTS-index.md');

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

  if (!harnessSetup.includes('/doc-sync')) {
    fail('skills/harness-setup/SKILL.md: expected scaffold guidance for /doc-sync');
  }

  if (!fileSpecs.includes('/doc-sync')) {
    fail('skills/harness-setup/references/file-specs.md: expected AGENTS scaffold guidance for /doc-sync');
  }

  if (!agentsTemplate.includes('/doc-sync')) {
    fail('skills/harness-setup/templates/AGENTS-index.md: expected default /doc-sync skill entry');
  }

  if (!harnessSpec.includes('/doc-sync')) {
    fail('docs/product-specs/harness-engineering.md: expected /doc-sync scaffold capability');
  }
}

function assertHarnessProfilesDocs() {
  const harnessSetup = read('.claude/skills/harness-setup/SKILL.md');
  const harnessSpec = read('docs/product-specs/harness-engineering.md');
  const methodology = read('docs/HARNESS_METHODOLOGY.md');
  const readme = read('README.md');

  for (const profile of ['light', 'standard', 'strict']) {
    if (!harnessSetup.includes(`\`${profile}\``)) {
      fail(`.claude/skills/harness-setup/SKILL.md: missing scaffold profile ${profile}`);
    }
    if (!harnessSpec.includes(`\`${profile}\``)) {
      fail(`docs/product-specs/harness-engineering.md: missing scaffold profile ${profile}`);
    }
  }

  if (!harnessSetup.includes('Agent platforms + profile')) {
    fail('.claude/skills/harness-setup/SKILL.md: expected profile selection step');
  }

  if (!harnessSetup.includes('Profile-specific output rules')) {
    fail('.claude/skills/harness-setup/SKILL.md: expected profile-specific output rules');
  }

  if (!methodology.includes('Profile-first scaffold')) {
    fail('docs/HARNESS_METHODOLOGY.md: expected profile-first scaffold guidance');
  }

  if (!readme.includes('`/harness-setup` 现在支持三种 scaffold profile')) {
    fail('README.md: expected scaffold profile overview');
  }
}

function assertHarnessGuideDocs() {
  const readme = read('README.md');
  const agentsDoc = read('AGENTS.md');
  const guide = read('docs/guides/harness-guide.md');

  if (!readme.includes('docs/guides/harness-guide.md')) {
    fail('README.md: expected harness guide link');
  }

  if (!agentsDoc.includes('docs/guides/harness-guide.md')) {
    fail('AGENTS.md: expected harness guide link');
  }

  [
    'harness help',
    'harness audit',
    'harness guide',
    'harness quality gate',
    '/harness-setup',
    '/brainstorming',
    '/writing-plans',
    '/dev-workflow',
    'strict',
    'docs / memory / feedback',
  ].forEach((snippet) => {
    if (!guide.includes(snippet)) {
      fail(`docs/guides/harness-guide.md: missing "${snippet}"`);
    }
  });
}

function assertHarnessEntrySkills() {
  const agentsDoc = read('AGENTS.md');
  const guide = read('docs/guides/harness-guide.md');
  const skillSystem = read('docs/product-specs/skill-system.md');

  [
    '/harness-help',
    '/harness-audit',
    '/harness-guide',
    '/harness-quality-gate',
  ].forEach((snippet) => {
    if (!agentsDoc.includes(snippet)) {
      fail(`AGENTS.md: expected ${snippet} skill entry`);
    }

    if (!skillSystem.includes(snippet.replace('/', ''))) {
      fail(`docs/product-specs/skill-system.md: expected ${snippet} builtin skill reference`);
    }
  });

  [
    'harness help',
    'harness audit',
    'harness guide',
    'harness quality gate',
  ].forEach((snippet) => {
    if (!guide.includes(snippet)) {
      fail(`docs/guides/harness-guide.md: expected "${snippet}" root entry guidance`);
    }
  });
}

function assertPlanPersistDocs() {
  const hooksJson = read('hooks/hooks.json');
  const reliability = read('docs/RELIABILITY.md');
  const runTraceProtocol = read('docs/references/run-trace-protocol.md');
  const workflow = read('skills/dev-workflow/SKILL.md');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const agentsDoc = read('AGENTS.md');
  const guide = read('docs/guides/harness-guide.md');
  const skillSystem = read('docs/product-specs/skill-system.md');
  const planPersist = read('skills/plan-persist/SKILL.md');
  const planStatusHook = read('scripts/hooks/plan-status.js');
  const planRefreshHook = read('scripts/hooks/plan-refresh.js');
  const planWriteReminderHook = read('scripts/hooks/plan-write-reminder.js');
  const planStopCheckHook = read('scripts/hooks/plan-stop-check.js');

  [
    '"UserPromptSubmit"',
    '"PreToolUse"',
    '"PostToolUse"',
    '"Stop"',
    'scripts/hooks/plan-status.js',
    'scripts/hooks/plan-refresh.js',
    'scripts/hooks/plan-write-reminder.js',
    'scripts/hooks/plan-stop-check.js',
  ].forEach((snippet) => {
    if (!hooksJson.includes(snippet)) {
      fail(`hooks/hooks.json: missing ${snippet}`);
    }
  });

  if (!agentsDoc.includes('/plan-persist')) {
    fail('AGENTS.md: expected /plan-persist skill entry');
  }

  if (!guide.includes('/plan-persist')) {
    fail('docs/guides/harness-guide.md: expected /plan-persist usage guidance');
  }

  if (!skillSystem.includes('plan-persist')) {
    fail('docs/product-specs/skill-system.md: expected plan-persist builtin skill reference');
  }

  if (!workflow.includes('/plan-persist')) {
    fail('skills/dev-workflow/SKILL.md: expected /plan-persist integration');
  }

  if (!agentSpec.includes('/plan-persist')) {
    fail('docs/product-specs/agent-system.md: expected /plan-persist shared capability');
  }

  [
    'drift_status',
    'drift_signals',
    'pending_operation_gate',
  ].forEach((snippet) => {
    if (!planPersist.includes(snippet)) {
      fail(`skills/plan-persist/SKILL.md: expected ${snippet} in status contract`);
    }
  });

  [
    'missing-run-trace',
    'missing-plan-path',
    'pending-operation-gate',
    'unresolved-plan-drift',
  ].forEach((snippet) => {
    if (!workflow.includes(snippet)) {
      fail(`skills/dev-workflow/SKILL.md: expected plan drift signal ${snippet}`);
    }

    if (!runTraceProtocol.includes(snippet)) {
      fail(`docs/references/run-trace-protocol.md: expected plan drift signal ${snippet}`);
    }

    if (!reliability.includes(snippet)) {
      fail(`docs/RELIABILITY.md: expected plan drift signal ${snippet}`);
    }
  });

  [
    'drift_signals',
    'pending_operation_gate',
  ].forEach((snippet) => {
    if (!planStatusHook.includes(snippet)) {
      fail(`scripts/hooks/plan-status.js: expected ${snippet} output`);
    }

    if (!planRefreshHook.includes(snippet)) {
      fail(`scripts/hooks/plan-refresh.js: expected ${snippet} output`);
    }
  });

  if (!planWriteReminderHook.includes('drift signal')) {
    fail('scripts/hooks/plan-write-reminder.js: expected drift signal reminder');
  }

  if (!planStopCheckHook.includes('unresolved drift')) {
    fail('scripts/hooks/plan-stop-check.js: expected unresolved drift stop check');
  }

  ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop'].forEach((snippet) => {
    if (!reliability.includes(snippet)) {
      fail(`docs/RELIABILITY.md: expected ${snippet} hook continuity guidance`);
    }

    if (!runTraceProtocol.includes(snippet)) {
      fail(`docs/references/run-trace-protocol.md: expected ${snippet} hook-assisted resume guidance`);
    }
  });
}

function assertChallengerDocs() {
  const agentsDoc = read('AGENTS.md');
  const designIndex = read('docs/design-docs/index.md');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const workflow = read('skills/dev-workflow/SKILL.md');
  const challengerDesign = read('docs/design-docs/2026-04-16-challenger-agent-design.md');
  const challengerDoc = read('docs/design-docs/challenger.md');
  const challengerAgent = read('agents/challenger.md');

  if (!agentsDoc.includes('Challenger')) {
    fail('AGENTS.md: expected Challenger team entry');
  }

  if (!designIndex.includes('challenger.md')) {
    fail('docs/design-docs/index.md: expected challenger agent doc entry');
  }

  if (!designIndex.includes('2026-04-16-challenger-agent-design.md')) {
    fail('docs/design-docs/index.md: expected challenger design doc entry');
  }

  if (!agentSpec.includes('.claude/agents/challenger.md')) {
    fail('docs/product-specs/agent-system.md: expected challenger agent spec entry');
  }

  if (!workflow.includes('challenger')) {
    fail('skills/dev-workflow/SKILL.md: expected challenger integration');
  }

  if (!workflow.includes('### Challenger Gate')) {
    fail('skills/dev-workflow/SKILL.md: expected Challenger Gate section');
  }

  [
    'trigger_reason:',
    'challenge_required:',
    'evidence_refs:',
    'blocking_threshold:',
    'completion-claim',
  ].forEach((snippet) => {
    if (!workflow.includes(snippet)) {
      fail(`skills/dev-workflow/SKILL.md: expected challenger gate contract field ${snippet}`);
    }
  });

  if (!challengerDesign.includes('CLAIM:')) {
    fail('docs/design-docs/2026-04-16-challenger-agent-design.md: expected challenger output contract');
  }

  if (!challengerDoc.includes('CLAIM:')) {
    fail('docs/design-docs/challenger.md: expected challenger handoff format');
  }

  if (!challengerAgent.includes('VERDICT: CONFIRMED / REFUTED / UNVERIFIED')) {
    fail('agents/challenger.md: expected challenger verdict contract');
  }

  [
    'trigger_reason:',
    'review_scope:',
    'evidence_refs:',
    'blocking_threshold:',
    'recommended_gate:',
  ].forEach((snippet) => {
    if (!challengerDoc.includes(snippet)) {
      fail(`docs/design-docs/challenger.md: expected challenger handoff field ${snippet}`);
    }

    if (!challengerAgent.includes(snippet)) {
      fail(`agents/challenger.md: expected challenger handoff field ${snippet}`);
    }
  });

  if (!agentSpec.includes('Challenger Gate')) {
    fail('docs/product-specs/agent-system.md: expected Challenger Gate integration');
  }
}

function assertSubagentFailureRecovery() {
  const workflow = read('skills/dev-workflow/SKILL.md');
  const reviewerAgent = read('agents/reviewer.md');
  const testerAgent = read('agents/tester.md');
  const reviewerDoc = read('docs/design-docs/reviewer.md');
  const testerDoc = read('docs/design-docs/tester.md');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const readme = read('README.md');

  if (!workflow.includes('### Subagent Failure Handling')) {
    fail('skills/dev-workflow/SKILL.md: expected Subagent Failure Handling section');
  }

  [
    'empty-result',
    'invalid-handoff',
    'tool-execution-failure',
    'reviewer-failure-retry',
    'tester-stage-required',
    'main-agent-fallback',
  ].forEach((snippet) => {
    if (!workflow.includes(snippet)) {
      fail(`skills/dev-workflow/SKILL.md: expected subagent failure recovery signal ${snippet}`);
    }
  });

  [
    'failure_type:',
    'failure_stage:',
    'retry_recommended:',
    'fallback_allowed:',
  ].forEach((snippet) => {
    if (!reviewerAgent.includes(snippet)) {
      fail(`agents/reviewer.md: expected failure recovery field ${snippet}`);
    }

    if (!testerAgent.includes(snippet)) {
      fail(`agents/tester.md: expected failure recovery field ${snippet}`);
    }
  });

  if (!reviewerAgent.includes('无法产出完整交接文档时输出 `BLOCKED`')) {
    fail('agents/reviewer.md: expected BLOCKED invalid-handoff rule');
  }

  if (!testerAgent.includes('不得把 build/dev server 成功当作 Tester handoff 的替代')) {
    fail('agents/tester.md: expected no-silent-skip rule');
  }

  if (!reviewerDoc.includes('failure_type:') || !testerDoc.includes('failure_type:')) {
    fail('docs/design-docs/reviewer.md or docs/design-docs/tester.md: expected failure recovery contract');
  }

  if (!agentSpec.includes('Subagent Failure Handling')) {
    fail('docs/product-specs/agent-system.md: expected Subagent Failure Handling integration');
  }

  if (!agentSpec.includes('Tester 不得被静默跳过')) {
    fail('docs/product-specs/agent-system.md: expected mandatory tester gate');
  }

  if (!readme.includes('空返回或无效 handoff 不能被当作通过')) {
    fail('README.md: expected subagent failure guidance');
  }
}

function assertSubagentPayloadGuardrails() {
  const workflow = read('skills/dev-workflow/SKILL.md');
  const reliability = read('docs/RELIABILITY.md');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const readme = read('README.md');

  if (!workflow.includes('### Subagent Payload Guardrails')) {
    fail('skills/dev-workflow/SKILL.md: expected Subagent Payload Guardrails section');
  }

  [
    'payload_mode:',
    'changed_files_summary:',
    'evidence_refs:',
    'prompt-budget',
    'do-not-inline-full-file-list',
    'timeout-aware-retry',
    'narrowed-payload-retry',
  ].forEach((snippet) => {
    if (!workflow.includes(snippet)) {
      fail(`skills/dev-workflow/SKILL.md: expected payload guardrail ${snippet}`);
    }
  });

  [
    'payload_mode',
    'timeout-aware-retry',
    'narrowed-payload-retry',
  ].forEach((snippet) => {
    if (!reliability.includes(snippet)) {
      fail(`docs/RELIABILITY.md: expected subagent reliability guidance ${snippet}`);
    }

    if (!agentSpec.includes(snippet)) {
      fail(`docs/product-specs/agent-system.md: expected subagent payload guidance ${snippet}`);
    }
  });

  if (!readme.includes('不要把全量文件列表和重复规则直接塞进 subagent prompt')) {
    fail('README.md: expected subagent payload guidance');
  }
}

function assertHarnessAuditDocs() {
  const qualityScore = read('docs/QUALITY_SCORE.md');
  const harnessAudit = read('skills/harness-audit/SKILL.md');
  const harnessSpec = read('docs/product-specs/harness-engineering.md');
  const harnessSetup = read('skills/harness-setup/SKILL.md');
  const fileSpecs = read('skills/harness-setup/references/file-specs.md');

  if (!qualityScore.includes('Harness Audit 映射')) {
    fail('docs/QUALITY_SCORE.md: expected Harness Audit mapping section');
  }

  if (!qualityScore.includes('### Harness Audit Report')) {
    fail('docs/QUALITY_SCORE.md: expected audit output contract');
  }

  if (!harnessAudit.includes('category_scores')) {
    fail('skills/harness-audit/SKILL.md: expected category_scores in audit output');
  }

  if (!harnessSpec.includes('/harness-audit')) {
    fail('docs/product-specs/harness-engineering.md: expected /harness-audit scaffold capability');
  }

  if (!harnessSetup.includes('/harness-audit')) {
    fail('skills/harness-setup/SKILL.md: expected harness root entry exposure');
  }

  if (!fileSpecs.includes('/harness-audit')) {
    fail('skills/harness-setup/references/file-specs.md: expected harness audit root entry guidance');
  }
}

function assertMemoryToSkillDocs() {
  const feedbackDoc = read('docs/feedback/feedback-collection.md');
  const recurrenceDoc = read('docs/memory/feedback/prevents-recurrence.md');
  const feedbackQuery = read('skills/feedback-query/SKILL.md');
  const skillCreator = read('skills/skill-creator/SKILL.md');
  const skillSystem = read('docs/product-specs/skill-system.md');
  const designIndex = read('docs/design-docs/index.md');

  if (!feedbackDoc.includes('### Skill Promotion Candidate')) {
    fail('docs/feedback/feedback-collection.md: expected Skill Promotion Candidate section');
  }

  if (!recurrenceDoc.includes('### Skill Promotion Candidate')) {
    fail('docs/memory/feedback/prevents-recurrence.md: expected Skill Promotion Candidate section');
  }

  if (!feedbackQuery.includes('skill-candidates')) {
    fail('skills/feedback-query/SKILL.md: expected skill-candidates query guidance');
  }

  if (!skillCreator.includes('Memory-to-Skill Promotion')) {
    fail('skills/skill-creator/SKILL.md: expected memory-driven skill creation guidance');
  }

  if (!skillSystem.includes('Memory-driven Skill Promotion')) {
    fail('docs/product-specs/skill-system.md: expected memory-to-skill spec guidance');
  }

  if (!designIndex.includes('2026-04-16-memory-to-skill-design.md')) {
    fail('docs/design-docs/index.md: expected memory-to-skill design entry');
  }
}

function assertPainPointDocs() {
  const readme = read('README.md');
  const methodology = read('docs/HARNESS_METHODOLOGY.md');
  const plans = read('docs/PLANS.md');
  const harnessSpec = read('docs/product-specs/harness-engineering.md');
  const designIndex = read('docs/design-docs/index.md');
  const painPointDoc = read('docs/design-docs/2026-04-16-harness-pain-point-matrix.md');

  [
    '先写代码后思考',
    '计划漂移',
    '验证缺失',
    '文档腐坏',
    '反馈无法沉淀',
    '恢复困难',
  ].forEach((snippet) => {
    if (!painPointDoc.includes(snippet)) {
      fail(`docs/design-docs/2026-04-16-harness-pain-point-matrix.md: missing core pain point ${snippet}`);
    }
  });

  if (!readme.includes('## 核心痛点与当前解法')) {
    fail('README.md: expected pain-point-first overview section');
  }

  if (!methodology.includes('Pain-point-first 产品表达')) {
    fail('docs/HARNESS_METHODOLOGY.md: expected pain-point-first methodology section');
  }

  ['P0', 'P1', 'P2'].forEach((snippet) => {
    if (!plans.includes(snippet)) {
      fail(`docs/PLANS.md: expected roadmap layer ${snippet}`);
    }
  });

  if (!harnessSpec.includes('Pain-point-first 对外表达')) {
    fail('docs/product-specs/harness-engineering.md: expected pain-point-first product requirement');
  }

  if (!designIndex.includes('2026-04-16-harness-pain-point-matrix.md')) {
    fail('docs/design-docs/index.md: expected pain-point matrix entry');
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
    '`doc-sync-cross-mode-contract`',
  ].forEach((snippet) => {
    if (!evalScenarios.includes(snippet)) {
      fail(`docs/references/eval-scenarios.md: missing required scenario ${snippet}`);
    }
  });
}

function assertDocSyncContracts() {
  const agentsDoc = read('AGENTS.md');
  const workflow = read('skills/dev-workflow/SKILL.md');
  const architect = read('docs/design-docs/architect.md');
  const claudeArchitect = read('.claude/agents/architect.md');
  const codexArchitect = read('.codex/agents/architect.toml');
  const agentSpec = read('docs/product-specs/agent-system.md');
  const docSync = read('skills/doc-sync/SKILL.md');
  const docSyncYaml = read('skills/doc-sync/agents/openai.yaml');

  if (!agentsDoc.includes('/doc-sync')) {
    fail('AGENTS.md: expected /doc-sync skill entry');
  }

  if (!workflow.includes('/doc-sync')) {
    fail('skills/dev-workflow/SKILL.md: expected Doc Sync stage to reference /doc-sync');
  }

  if (!architect.includes('/doc-sync')) {
    fail('docs/design-docs/architect.md: expected /doc-sync integration');
  }

  if (!claudeArchitect.includes('/doc-sync')) {
    fail('.claude/agents/architect.md: expected /doc-sync integration');
  }

  if (!codexArchitect.includes('/doc-sync')) {
    fail('.codex/agents/architect.toml: expected /doc-sync integration');
  }

  if (!agentSpec.includes('/doc-sync')) {
    fail('docs/product-specs/agent-system.md: expected /doc-sync shared-capability guidance');
  }

  if (!docSync.includes('### Doc Sync Result')) {
    fail('skills/doc-sync/SKILL.md: expected Doc Sync Result contract');
  }

  if (!docSync.includes('reviewed_no_change')) {
    fail('skills/doc-sync/SKILL.md: expected reviewed_no_change guidance');
  }

  if (!docSyncYaml.includes('display_name: "Doc Sync"')) {
    fail('skills/doc-sync/agents/openai.yaml: expected display_name');
  }

  if (!docSyncYaml.includes('$doc-sync')) {
    fail('skills/doc-sync/agents/openai.yaml: expected default_prompt to mention $doc-sync');
  }
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

function assertCodexAgentDirectory() {
  const sourceFiles = listFilesRecursive('.claude/agents').filter((relPath) => relPath.endsWith('.md'));
  const codexFiles = listFilesRecursive('.codex/agents');
  const expectedFiles = new Set(sourceFiles.map((relPath) => relPath.replace(/\.md$/, '.toml')));

  for (const relPath of sourceFiles) {
    const agentName = path.basename(relPath, '.md');
    const targetRelPath = relPath.replace(/\.md$/, '.toml');

    if (!expectedFiles.has(targetRelPath)) {
      fail(`.codex/agents: unable to derive expected Codex agent path for ${relPath}`);
      continue;
    }

    if (!codexFiles.includes(targetRelPath)) {
      fail(`.codex/agents: missing generated file ${targetRelPath} from .claude/agents/${relPath}`);
      continue;
    }

    const expectedToml = renderCodexAgentToml(agentName, read(path.join('.claude/agents', relPath)));
    const actualToml = read(path.join('.codex/agents', targetRelPath));
    if (expectedToml !== actualToml) {
      fail(`.codex/agents: content drift for ${targetRelPath} (expected generated Codex TOML from .claude/agents/${relPath})`);
    }
  }

  for (const relPath of codexFiles) {
    if (!expectedFiles.has(relPath)) {
      fail(`.codex/agents: unexpected extra file ${relPath} not generated from .claude/agents`);
    }
  }
}

function assertCodexHooksConfig() {
  let parsed;
  try {
    parsed = JSON.parse(read('.codex/hooks.json'));
  } catch {
    fail('.codex/hooks.json: must be valid JSON');
    parsed = null;
  }

  if (parsed) {
    const postToolHooks = parsed.hooks?.PostToolUse;
    const stopHooks = parsed.hooks?.Stop;

    if (!Array.isArray(postToolHooks) || postToolHooks.length === 0) {
      fail('.codex/hooks.json: expected PostToolUse hook entry');
    }

    if (!Array.isArray(stopHooks) || stopHooks.length === 0) {
      fail('.codex/hooks.json: expected Stop hook entry');
    }

    const postCommand = postToolHooks?.[0]?.hooks?.[0]?.command || '';
    if (!String(postCommand).includes('/.codex/scripts/hooks/post-tool-use.js')) {
      fail('.codex/hooks.json: PostToolUse should point to .codex/scripts/hooks/post-tool-use.js');
    }

    const stopCommand = stopHooks?.[0]?.hooks?.[0]?.command || '';
    if (!String(stopCommand).includes('/.codex/scripts/hooks/stop.js')) {
      fail('.codex/hooks.json: Stop should point to .codex/scripts/hooks/stop.js');
    }
  }

  const configToml = read('.codex/config.toml');
  if (!configToml.includes('[features]') || !configToml.includes('codex_hooks = true')) {
    fail('.codex/config.toml: expected codex_hooks feature toggle');
  }
}

function runNodeScript(scriptPath, args, options = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: options.cwd || repoRoot,
    input: options.input || '',
    encoding: 'utf8',
    env: options.env || process.env,
    timeout: options.timeout || 30000,
  });
}

function assertCodexHookRuntime() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-harness-codex-hook-'));
  const activePlanDir = path.join(tempRoot, 'docs', 'exec-plans', 'active');
  fs.mkdirSync(activePlanDir, { recursive: true });
  fs.writeFileSync(
    path.join(activePlanDir, '2026-04-22-codex-hook-smoke.md'),
    [
      '# Codex Hook Smoke',
      '',
      '### Run Trace',
      '- plan_path: docs/exec-plans/active/2026-04-22-codex-hook-smoke.md',
      '',
      '### Plan Drift',
      '- drift_detected: true',
      '- resolved_by:',
      '',
      '### Operation Gate',
      '- confirmation_status: pending',
      '',
      '### Final Summary',
      '- plan_drift_status: unresolved',
      '',
      '- [ ] remaining step',
      '',
    ].join('\n')
  );

  try {
    const postToolResult = runNodeScript(path.join(repoRoot, '.codex', 'scripts', 'hooks', 'post-tool-use.js'), [], {
      cwd: tempRoot,
      input: JSON.stringify({
        hook_event_name: 'PostToolUse',
        cwd: tempRoot,
        tool_name: 'Bash',
        tool_input: { command: 'echo ok' },
      }),
    });

    if (postToolResult.error || postToolResult.status !== 0) {
      fail('.codex hook runtime: PostToolUse hook runner should exit successfully');
    } else {
      try {
        const parsed = JSON.parse(postToolResult.stdout || '{}');
        if (typeof parsed.systemMessage !== 'string' || parsed.systemMessage.length === 0) {
          fail('.codex hook runtime: PostToolUse hook should emit systemMessage JSON');
        }
        if (parsed.hookSpecificOutput != null) {
          fail('.codex hook runtime: PostToolUse hook should not emit hookSpecificOutput unless returning a block decision');
        }
      } catch {
        fail('.codex hook runtime: PostToolUse hook stdout must be valid JSON');
      }
    }

    const stopResult = runNodeScript(path.join(repoRoot, '.codex', 'scripts', 'hooks', 'stop.js'), [], {
      cwd: tempRoot,
      input: JSON.stringify({
        hook_event_name: 'Stop',
        cwd: tempRoot,
        stop_hook_active: false,
        last_assistant_message: 'done',
      }),
    });

    if (stopResult.error || stopResult.status !== 0) {
      fail('.codex hook runtime: Stop hook runner should exit successfully');
    } else {
      try {
        const parsed = JSON.parse(stopResult.stdout || '{}');
        if (typeof parsed.systemMessage !== 'string' || parsed.systemMessage.length === 0) {
          fail('.codex hook runtime: Stop hook should emit systemMessage JSON');
        }
      } catch {
        fail('.codex hook runtime: Stop hook stdout must be valid JSON');
      }
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function main() {
  const requiredPaths = [
    'AGENTS.md',
    'README.md',
    'agents/architect.md',
    'agents/challenger.md',
    'agents/feedback-curator.md',
    'docs/design-docs/index.md',
    'docs/design-docs/challenger.md',
    'docs/design-docs/2026-04-16-challenger-agent-design.md',
    'docs/design-docs/2026-04-16-harness-pain-point-matrix.md',
    'docs/exec-plans/index.md',
    'docs/exec-plans/completed/2026-04-15-claude-marketplace-install.md',
    '.claude/agents/tester.md',
    '.claude/agents/challenger.md',
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    '.claude/hooks/hooks.json',
    '.codex/config.toml',
    '.codex/hooks.json',
    '.codex/agents/feedback-curator.toml',
    '.codex/agents/challenger.toml',
    'skills/doc-sync/SKILL.md',
    'skills/plan-persist/SKILL.md',
    'skills/harness-help/SKILL.md',
    'skills/harness-audit/SKILL.md',
    'skills/harness-guide/SKILL.md',
    'skills/harness-quality-gate/SKILL.md',
    'skills/doc-sync/agents/openai.yaml',
    '.claude/skills/doc-sync/SKILL.md',
    '.claude/skills/plan-persist/SKILL.md',
    '.claude/skills/harness-help/SKILL.md',
    '.claude/skills/harness-audit/SKILL.md',
    '.claude/skills/harness-guide/SKILL.md',
    '.claude/skills/harness-quality-gate/SKILL.md',
    '.claude/skills/doc-sync/agents/openai.yaml',
    '.codex/skills/doc-sync/SKILL.md',
    '.codex/skills/plan-persist/SKILL.md',
    '.codex/skills/harness-help/SKILL.md',
    '.codex/skills/harness-audit/SKILL.md',
    '.codex/skills/harness-guide/SKILL.md',
    '.codex/skills/harness-quality-gate/SKILL.md',
    '.codex/skills/doc-sync/agents/openai.yaml',
    'examples/claude-code/project-settings.json',
    'examples/claude-code/global-settings.json',
    'skills/dev-workflow/SKILL.md',
    '.claude/skills/dev-workflow/SKILL.md',
    '.claude/hook-logging.json',
    'scripts/hooks/session-start.js',
    '.claude/scripts/hooks/plan-status.js',
    '.claude/scripts/hooks/plan-refresh.js',
    '.claude/scripts/hooks/plan-write-reminder.js',
    '.claude/scripts/hooks/plan-stop-check.js',
    'scripts/hooks/plan-status.js',
    'scripts/hooks/plan-refresh.js',
    'scripts/hooks/plan-write-reminder.js',
    'scripts/hooks/plan-stop-check.js',
    '.codex/scripts/hooks/codex-hook-common.js',
    '.codex/scripts/hooks/post-tool-use.js',
    '.codex/scripts/hooks/stop.js',
    '.codex/hook-logging.json',
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
  assertHarnessProfilesDocs();
  assertHarnessGuideDocs();
  assertHarnessEntrySkills();
  assertPlanPersistDocs();
  assertChallengerDocs();
  assertSubagentFailureRecovery();
  assertSubagentPayloadGuardrails();
  assertHarnessAuditDocs();
  assertMemoryToSkillDocs();
  assertPainPointDocs();
  assertDangerousModeSettingsDocs();
  assertEvalCoverageDocs();
  assertDocSyncContracts();
  assertRiskModelDocs();
  assertMirrorSyncTooling();
  assertRunTraceDocs();
  assertMirrorDirectory('.claude/skills', 'skills');
  assertMirrorDirectory('.claude/skills', '.codex/skills');
  assertMirrorDirectory('.claude/agents', 'agents');
  assertCodexAgentDirectory();
  assertCodexHooksConfig();
  assertCodexHookRuntime();
  assertMirrorDirectory('.claude/scripts/hooks', 'scripts/hooks');
  assertMirrorDirectory('hooks', '.claude/hooks');

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
