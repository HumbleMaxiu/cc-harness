'use strict';

async function grade(context) {
  const required = [
    'artifacts/brainstorming.md',
    'docs/exec-plans/active/small-task.md',
    'artifacts/skill-workflow-record.md',
    'artifacts/run-trace.json',
    'artifacts/runtime/brainstorming/prompt.md',
    'artifacts/runtime/brainstorming/transcript.md',
    'artifacts/runtime/writing-plans/prompt.md',
    'artifacts/runtime/writing-plans/transcript.md',
    'artifacts/runtime/dev-workflow/prompt.md',
    'artifacts/runtime/dev-workflow/transcript.md',
  ];

  for (const relPath of required) {
    context.assert(context.submission.exists(relPath), `missing e2e artifact ${relPath}`);
  }

  if (!required.every((relPath) => context.submission.exists(relPath))) {
    return {
      passed: false,
      summary: 'E2E workflow artifacts are incomplete.',
      findings: [],
    };
  }

  const brainstorming = context.submission.read('artifacts/brainstorming.md');
  const plan = context.submission.read('docs/exec-plans/active/small-task.md');
  const workflow = context.submission.read('artifacts/skill-workflow-record.md');
  const trace = context.submission.readJson('artifacts/run-trace.json');
  const brainstormingTranscript = context.submission.read('artifacts/runtime/brainstorming/transcript.md');
  const workflowTranscript = context.submission.read('artifacts/runtime/dev-workflow/transcript.md');

  context.assertIncludes(brainstorming, 'Options Considered', 'brainstorming artifact');
  context.assertIncludes(brainstorming, 'Recommendation', 'brainstorming artifact');
  context.assertIncludes(brainstormingTranscript, 'Decision', 'brainstorming transcript');
  context.assertIncludes(plan, '## Goal', 'exec plan');
  context.assertIncludes(plan, '## Steps', 'exec plan');

  [
    '### Mode Decision',
    '### Execution',
    '### Self Review',
    '### Verification',
    '### Doc Sync',
    '### Final Summary',
  ].forEach((snippet) => context.assertIncludes(workflow, snippet, 'skill workflow record'));

  context.assert(trace.current_phase === 'Done',
    'run-trace: current_phase must be Done');
  context.assert(trace.workflow_status === 'APPROVED',
    'run-trace: workflow_status must be APPROVED');
  context.assert(trace.runtime_mode === 'skill-runtime-adapter',
    'run-trace: runtime_mode must indicate the skill runtime adapter');
  context.assert(Array.isArray(trace.checkpoints) && trace.checkpoints.includes('brainstorming')
      && trace.checkpoints.includes('writing-plans') && trace.checkpoints.includes('dev-workflow'),
    'run-trace: checkpoints must include brainstorming, writing-plans, and dev-workflow');
  context.assertIncludes(workflowTranscript, 'Verification Result', 'dev-workflow transcript');

  return {
    passed: true,
    summary: 'Small-task E2E flow reaches completion from brainstorming through dev-workflow.',
    findings: [],
  };
}

module.exports = { grade };
