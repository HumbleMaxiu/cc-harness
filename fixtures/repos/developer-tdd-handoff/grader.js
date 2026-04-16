'use strict';

async function grade(context) {
  context.assert(context.submission.exists('handoff/developer.md'),
    'submission must include handoff/developer.md');

  if (!context.submission.exists('handoff/developer.md')) {
    return {
      passed: false,
      summary: 'Developer handoff is missing.',
      findings: [],
    };
  }

  const handoff = context.submission.read('handoff/developer.md');
  context.assertIncludes(handoff, '### 完成内容', 'developer handoff');
  context.assertIncludes(handoff, 'files_touched:', 'developer handoff');
  context.assertIncludes(handoff, '### 自检结果', 'developer handoff');
  context.assertIncludes(handoff, 'test_commands:', 'developer handoff');
  context.assertIncludes(handoff, 'result: PASS', 'developer handoff');
  context.assertIncludes(handoff, '### Artifacts', 'developer handoff');
  context.assert(
    handoff.includes('### 状态\nAPPROVED') || handoff.includes('### 状态\nREJECTED') || handoff.includes('### 状态\nBLOCKED'),
    'developer handoff: final status must be present'
  );

  return {
    passed: true,
    summary: 'Developer handoff preserves TDD/self-check evidence and a clear status.',
    findings: [],
  };
}

module.exports = { grade };
