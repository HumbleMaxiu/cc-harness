#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const failures = [];
const fixturesRoot = path.join(repoRoot, 'fixtures', 'repos');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function readJson(relPath) {
  return JSON.parse(read(relPath));
}

function fail(message) {
  failures.push(message);
}

function expectIncludes(content, snippet, label) {
  if (!content.includes(snippet)) {
    fail(`${label}: missing "${snippet}"`);
  }
}

function checkEvalScenarioCoverage() {
  const scenarios = read('docs/references/eval-scenarios.md');

  [
    '`skill-success-loop`',
    '`skill-plan-check-escalation`',
    '`skill-self-review-feedback-record`',
    '`skill-verification-uncertainty`',
  ].forEach((id) => expectIncludes(scenarios, id, 'docs/references/eval-scenarios.md'));

  [
    'Skill Workflow Record',
    'Mode Decision',
    'feedback_record',
    'uncovered risks',
  ].forEach((snippet) => expectIncludes(scenarios, snippet, 'docs/references/eval-scenarios.md'));
}

function checkSkillContracts() {
  const workflow = read('skills/dev-workflow/SKILL.md');
  const specialized = read('skills/dev-workflow/references/skill-mode-specialized-skills.md');
  const planCheck = read('skills/dev-workflow/internal-skills/plan-check-skill/SKILL.md');
  const selfReview = read('skills/dev-workflow/internal-skills/self-review-skill/SKILL.md');
  const verification = read('skills/dev-workflow/internal-skills/verification-skill/SKILL.md');

  expectIncludes(workflow, 'Plan Check', 'skills/dev-workflow/SKILL.md');
  expectIncludes(workflow, 'Self Review', 'skills/dev-workflow/SKILL.md');
  expectIncludes(workflow, 'Verify', 'skills/dev-workflow/SKILL.md');
  expectIncludes(workflow, '内部子 Skill 调用模式', 'skills/dev-workflow/SKILL.md');

  expectIncludes(specialized, '最小调用模式', 'skills/dev-workflow/references/skill-mode-specialized-skills.md');
  expectIncludes(planCheck, '### Mode Decision', 'plan-check-skill');
  expectIncludes(selfReview, 'feedback_record', 'self-review-skill');
  expectIncludes(verification, 'uncovered_risks', 'verification-skill');
}

function listFixtureScenarioFiles() {
  if (!fs.existsSync(fixturesRoot)) {
    fail('fixtures/repos: missing fixture scenario directory');
    return [];
  }

  return fs.readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join('fixtures', 'repos', entry.name, 'scenario.json'))
    .filter((relPath) => exists(relPath))
    .sort();
}

function checkFixtureScenarios() {
  const scenarioFiles = listFixtureScenarioFiles();

  if (scenarioFiles.length === 0) {
    fail('fixtures/repos: expected at least one fixture scenario');
    return;
  }

  for (const relPath of scenarioFiles) {
    const scenario = readJson(relPath);
    const label = `${relPath} (${scenario.id || 'unknown-id'})`;

    [
      'id',
      'title',
      'input_repo_state',
      'user_request',
      'expected_artifacts',
      'failure_signals',
      'required_paths',
      'assertions',
    ].forEach((field) => {
      if (!(field in scenario)) {
        fail(`${label}: missing field "${field}"`);
      }
    });

    if (!Array.isArray(scenario.required_paths) || scenario.required_paths.length === 0) {
      fail(`${label}: required_paths must be a non-empty array`);
      continue;
    }

    if (!Array.isArray(scenario.assertions) || scenario.assertions.length === 0) {
      fail(`${label}: assertions must be a non-empty array`);
      continue;
    }

    for (const requiredPath of scenario.required_paths) {
      if (!exists(requiredPath)) {
        fail(`${label}: missing required path ${requiredPath}`);
      }
    }

    for (const assertion of scenario.assertions) {
      if (!assertion.file || !assertion.includes) {
        fail(`${label}: each assertion needs file and includes`);
        continue;
      }

      if (!exists(assertion.file)) {
        fail(`${label}: assertion file missing ${assertion.file}`);
        continue;
      }

      const content = read(assertion.file);
      expectIncludes(content, assertion.includes, `${label}: ${assertion.file}`);
    }
  }
}

function main() {
  checkEvalScenarioCoverage();
  checkSkillContracts();
  checkFixtureScenarios();

  if (failures.length > 0) {
    console.error('Harness eval checks failed:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('Harness eval checks passed.');
}

main();
