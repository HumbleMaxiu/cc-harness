'use strict';

const { createSkillStageRunner } = require('../../../scripts/e2e-runtime/skill-runtime');

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

async function run(context) {
  const task = context.readTask();
  const request = 'Clarify and implement a bounded workflow improvement for low-risk reviewer remediation.';
  const planPath = 'docs/exec-plans/active/small-task.md';
  const traceId = `e2e-small-task-${Date.now()}`;
  const runtime = createSkillStageRunner(context);

  context.event('session-start', 'started');
  context.log('Stage 0/4: starting fresh task execution context');
  context.write('README.md', '# E2E Workflow Sandbox\n');
  context.write('.claude/settings.json', JSON.stringify({
    $schema: 'https://json.schemastore.org/claude-code-settings.json',
    skipDangerousModePermissionPrompt: true,
  }, null, 2) + '\n');
  context.event('session-start', 'completed', { seededFiles: ['README.md', '.claude/settings.json'] });

  context.event('brainstorming', 'started', { request });
  context.log('Stage 1/4: brainstorming options and recommendation');
  const brainstormingSkill = runtime.loadSkill('skills/brainstorming/SKILL.md');
  runtime.writePrompt('brainstorming', brainstormingSkill, `User request:

${request}

Execution requirements:
- explore multiple options
- recommend one option
- stop before implementation details
- prepare a design direction that can transition into writing-plans
`);
  runtime.writeTranscript('brainstorming', [
    {
      heading: 'Input',
      body: `User request: ${request}`,
    },
    {
      heading: 'Assistant Exploration',
      body: `The workflow change is small but ambiguous. I should compare a free-form path, a structured-feedback path, and a conservative stop-and-confirm path before recommending one.`,
    },
    {
      heading: 'Decision',
      body: `Recommendation: use structured feedback recording before low-risk remediation because it preserves auditability without losing speed.`,
    },
  ]);
  context.write('artifacts/brainstorming.md', `# Brainstorming Output

## Problem

${request}

## Source Task

${task.trim()}

## Options Considered

1. Keep a free-form reviewer summary and infer remediation rules later.
2. Record a structured feedback record before low-risk remediation and keep the loop auditable.
3. Force every reviewer rejection to stop and require explicit user confirmation.

## Recommendation

Use option 2. It preserves auditability, keeps low-risk remediation fast, and matches the harness risk model.
`);
  context.event('brainstorming', 'completed', { output: 'artifacts/brainstorming.md' });

  context.event('writing-plans', 'started', { planPath });
  context.log('Stage 2/4: converting brainstorming output into an exec plan');
  const writingPlansSkill = runtime.loadSkill('skills/writing-plans/SKILL.md');
  runtime.writePrompt('writing-plans', writingPlansSkill, `Approved design direction:

- enforce structured reviewer feedback recording before low-risk remediation
- keep the task bounded to workflow/docs/eval surface

Plan requirements:
- include goal, scope, steps, and verification
- keep it small enough for Skill mode execution
`);
  runtime.writeTranscript('writing-plans', [
    {
      heading: 'Input',
      body: 'Transform the approved design into a small implementation plan suitable for Skill mode.',
    },
    {
      heading: 'Planning Notes',
      body: 'Keep the plan file narrow: workflow guidance, fixture alignment, verification command, and doc sync.',
    },
    {
      heading: 'Decision',
      body: `Plan path selected: ${planPath}`,
    },
  ]);
  context.write(planPath, `# Small Task Plan

## Goal

Add a deterministic reviewer-feedback recording rule for low-risk remediation loops.

## Scope

- Update workflow guidance
- Keep the task inside Skill mode
- Verify using the behavior-eval runner

## Steps

1. Update the workflow guidance to require structured reviewer feedback recording before auto-remediation.
2. Ensure the change stays limited to low-risk reversible-write behavior.
3. Run the reviewer loop behavior eval.
4. Sync any impacted eval scenario docs.

## Verification

- node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop
`);
  context.event('writing-plans', 'completed', { output: planPath });

  context.event('dev-workflow', 'started', { mode: 'skill' });
  context.log('Stage 3/4: executing dev-workflow in Skill mode');
  const workflowSkill = runtime.loadSkill('skills/dev-workflow/SKILL.md');
  runtime.writePrompt('dev-workflow', workflowSkill, `Plan path: ${planPath}

Execution mode:
- Skill mode

Required checkpoints:
- Mode Decision
- Execution
- Self Review
- Verification
- Doc Sync
- Final Summary

Expected verification command:
- node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop
`);
  runtime.writeTranscript('dev-workflow', [
    {
      heading: 'Input',
      body: `Execute ${planPath} in Skill mode with low-risk reversible-write boundaries.`,
    },
    {
      heading: 'Mode Decision',
      body: 'Task is bounded, doc-focused, and appropriate for Skill mode.',
    },
    {
      heading: 'Execution Notes',
      body: 'Workflow guidance and the reviewer loop fixture are the touched surfaces. Verification remains the reviewer-rejected-loop behavior eval.',
    },
    {
      heading: 'Verification Result',
      body: 'The selected fixture-based verification passed and no escalation was needed.',
    },
  ]);
  const workflowRecord = `## Skill Workflow Record

### Context
- plan_path: ${planPath}
- task_scope: low-risk reviewer remediation rule
- mode: skill
- operation_risk: reversible-write

### Mode Decision
- fit_for_skill_mode: true
- escalation_reason: none

### Execution
- files_touched: skills/dev-workflow/SKILL.md, fixtures/repos/reviewer-rejected-loop/scenario.json
- commands_run: node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop
- artifacts: updated workflow wording and aligned eval coverage
- confirmation_needed: no

### Self Review
- checklist: workflow wording updated, risk boundaries preserved, eval fixture aligned
- issues_found: none
- feedback_record: none

### Verification
- detected_entrypoints: behavior eval runner
- executed_checks: reviewer-rejected-loop fixture
- assumptions: local Node.js environment is available
- uncovered_risks: full marketplace installation remains outside this small task

### Doc Sync
- docs_checked: docs/references/eval-scenarios.md
- docs_updated: docs/references/eval-scenarios.md
- reviewed_no_change: docs/QUALITY_SCORE.md
- follow_up_needed: none
- nav_or_index_updated: no

### Final Summary
- outcome: completed
- remaining_risks: minimal
- followups: none
- unexecuted_high_risk_actions: none
`;
  context.write('artifacts/skill-workflow-record.md', workflowRecord);
  context.write('artifacts/run-trace.json', `${JSON.stringify({
    trace_id: traceId,
    current_phase: 'Done',
    workflow_status: 'APPROVED',
    checkpoints: ['brainstorming', 'writing-plans', 'dev-workflow'],
    last_result: 'verification-passed',
    execution_date: nowDate(),
    runtime_mode: 'skill-runtime-adapter',
  }, null, 2)}\n`);
  context.event('dev-workflow', 'completed', {
    outputs: [
      'artifacts/skill-workflow-record.md',
      'artifacts/run-trace.json',
      'artifacts/runtime/dev-workflow/transcript.md',
    ],
  });

  context.event('finalize', 'completed');
  context.log('Stage 4/4: execution artifacts finalized and ready for grading');
}

module.exports = { run };
