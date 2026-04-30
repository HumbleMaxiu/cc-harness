'use strict';

async function grade(context) {
  context.assert(context.submission.exists('handoff/reviewer.md'),
    'submission must include handoff/reviewer.md');

  if (!context.submission.exists('handoff/reviewer.md')) {
    return {
      passed: false,
      summary: 'Reviewer handoff is missing.',
      findings: [],
    };
  }

  const handoff = context.submission.read('handoff/reviewer.md').replace(/\r\n/g, '\n');
  context.assertIncludes(handoff, '### Findings', 'reviewer handoff');
  context.assertIncludes(handoff, 'blocking: true', 'reviewer handoff');
  context.assertIncludes(handoff, '### Feedback Record', 'reviewer handoff');
  context.assertIncludes(handoff, 'source: reviewer', 'reviewer handoff');
  context.assertIncludes(handoff, 'action_type:', 'reviewer handoff');
  context.assertIncludes(handoff, 'operation_risk:', 'reviewer handoff');
  context.assertIncludes(handoff, 'prevents_recurrence:', 'reviewer handoff');
  context.assert(handoff.includes('### 状态\nREJECTED'),
    'reviewer handoff: final status must be REJECTED for a blocking case');

  return {
    passed: true,
    summary: 'Reviewer handoff preserves blocking findings and structured feedback for remediation.',
    findings: [],
  };
}

module.exports = { grade };
