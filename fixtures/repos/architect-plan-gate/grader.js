'use strict';

async function grade(context) {
  context.assert(context.submission.exists('handoff/architect.md'),
    'submission must include handoff/architect.md');

  if (!context.submission.exists('handoff/architect.md')) {
    return {
      passed: false,
      summary: 'Architect handoff is missing.',
      findings: [],
    };
  }

  const handoff = context.submission.read('handoff/architect.md').replace(/\r\n/g, '\n');
  context.assertIncludes(handoff, '### 范围确认', 'architect handoff');
  context.assertIncludes(handoff, 'execution_ready:', 'architect handoff');
  context.assertIncludes(handoff, '### 计划校验清单', 'architect handoff');
  context.assertIncludes(handoff, 'spec_present:', 'architect handoff');
  context.assertIncludes(handoff, 'test_paths_defined:', 'architect handoff');
  context.assertIncludes(handoff, '### 文档影响矩阵', 'architect handoff');
  context.assertIncludes(handoff, 'update:', 'architect handoff');
  context.assertIncludes(handoff, 'review_only:', 'architect handoff');
  context.assert(
    handoff.includes('### 状态\nAPPROVED') || handoff.includes('### 状态\nBLOCKED'),
    'architect handoff: final status must be APPROVED or BLOCKED'
  );

  return {
    passed: true,
    summary: 'Architect handoff captures readiness, checklist, and docs impact gating.',
    findings: [],
  };
}

module.exports = { grade };
