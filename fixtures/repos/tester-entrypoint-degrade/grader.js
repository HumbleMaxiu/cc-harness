'use strict';

async function grade(context) {
  context.assert(context.submission.exists('handoff/tester.md'),
    'submission must include handoff/tester.md');

  if (!context.submission.exists('handoff/tester.md')) {
    return {
      passed: false,
      summary: 'Tester handoff is missing.',
      findings: [],
    };
  }

  const handoff = context.submission.read('handoff/tester.md');
  context.assertIncludes(handoff, '### 测试矩阵', 'tester handoff');
  context.assertIncludes(handoff, '### 验证入口探测', 'tester handoff');
  context.assertIncludes(handoff, 'command_selection_rationale:', 'tester handoff');
  context.assertIncludes(handoff, '### 环境假设', 'tester handoff');
  context.assertIncludes(handoff, '### 未覆盖风险', 'tester handoff');
  context.assertIncludes(handoff, '### Feedback Record', 'tester handoff');
  context.assert(
    handoff.includes('### 状态\nAPPROVED') || handoff.includes('### 状态\nREJECTED') || handoff.includes('### 状态\nBLOCKED'),
    'tester handoff: final status must be present'
  );

  return {
    passed: true,
    summary: 'Tester handoff records entrypoint detection, assumptions, uncovered risks, and feedback.',
    findings: [],
  };
}

module.exports = { grade };
