'use strict';

async function grade(context) {
  context.assert(context.submission.exists('docs/memory/feedback/agent-feedback.md'),
    'submission must include updated docs/memory/feedback/agent-feedback.md');
  context.assert(context.submission.exists('handoff/feedback-curator.md'),
    'submission must include handoff/feedback-curator.md');

  if (!context.submission.exists('docs/memory/feedback/agent-feedback.md') ||
      !context.submission.exists('handoff/feedback-curator.md')) {
    return {
      passed: false,
      summary: 'Feedback curator artifacts are missing.',
      findings: [],
    };
  }

  const memoryDoc = context.submission.read('docs/memory/feedback/agent-feedback.md');
  const handoff = context.submission.read('handoff/feedback-curator.md').replace(/\r\n/g, '\n');

  context.assertIncludes(memoryDoc, 'id: af-', 'agent-feedback');
  context.assertIncludes(memoryDoc, 'execution:', 'agent-feedback');
  context.assertIncludes(memoryDoc, 'final_report:', 'agent-feedback');
  context.assertIncludes(memoryDoc, 'recorded_by: feedback-curator', 'agent-feedback');

  context.assertIncludes(handoff, '### 新增记录', 'feedback-curator handoff');
  context.assertIncludes(handoff, 'af-', 'feedback-curator handoff');
  context.assertIncludes(handoff, '### 自动处理摘要', 'feedback-curator handoff');
  context.assertIncludes(handoff, '已自动执行项：', 'feedback-curator handoff');
  context.assertIncludes(handoff, '待最终汇总项：', 'feedback-curator handoff');
  context.assert(
    handoff.includes('### 状态\nAPPROVED') || handoff.includes('### 状态\nBLOCKED'),
    'feedback-curator handoff: final status must be APPROVED or BLOCKED'
  );

  return {
    passed: true,
    summary: 'Feedback curator persists agent feedback and reports auto-processing status.',
    findings: [],
  };
}

module.exports = { grade };
