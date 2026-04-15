#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
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

function main() {
  checkEvalScenarioCoverage();
  checkSkillContracts();

  if (failures.length > 0) {
    console.error('Harness eval checks failed:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log('Harness eval checks passed.');
}

main();
