'use strict';

function lineCount(content) {
  return content.split(/\r?\n/).length;
}

async function grade(context) {
  const requiredFiles = [
    'AGENTS.md',
    'ARCHITECTURE.md',
    'docs/DESIGN.md',
    'docs/PLANS.md',
    'docs/PRODUCT_SENSE.md',
    'docs/QUALITY_SCORE.md',
    'docs/RELIABILITY.md',
    'docs/SECURITY.md',
    'docs/memory/index.md',
    'docs/memory/feedback/user-feedback.md',
    'docs/memory/feedback/agent-feedback.md',
    'docs/memory/feedback/prevents-recurrence.md',
    'docs/feedback/feedback-collection.md',
    'docs/design-docs/index.md',
    'docs/exec-plans/index.md',
    'docs/product-specs/index.md',
  ];

  for (const relPath of requiredFiles) {
    context.assert(context.submission.exists(relPath), `missing scaffold file ${relPath}`);
  }

  if (!context.submission.exists('AGENTS.md')) {
    return {
      passed: false,
      summary: 'Greenfield scaffold is missing AGENTS.md.',
      findings: [],
    };
  }

  const agents = context.submission.read('AGENTS.md');
  context.assertIncludes(agents, '## How to use this harness', 'AGENTS.md');
  context.assertIncludes(agents, 'docs/product-specs/<domain>.md', 'AGENTS.md');
  context.assertIncludes(agents, 'docs/PLANS.md', 'AGENTS.md');
  context.assert(lineCount(agents) <= 120, 'AGENTS.md: scaffold output should stay within the 120-line cap');

  if (context.submission.exists('docs/memory/index.md')) {
    const memoryIndex = context.submission.read('docs/memory/index.md');
    context.assertIncludes(memoryIndex, 'docs/memory/', 'docs/memory/index.md');
    context.assertIncludes(memoryIndex, 'feedback/user-feedback.md', 'docs/memory/index.md');
  }

  if (context.submission.exists('docs/feedback/feedback-collection.md')) {
    const feedbackCollection = context.submission.read('docs/feedback/feedback-collection.md');
    context.assertIncludes(feedbackCollection, 'Agent 反馈', 'docs/feedback/feedback-collection.md');
  }

  if (context.submission.exists('docs/exec-plans/index.md')) {
    const execPlansIndex = context.submission.read('docs/exec-plans/index.md');
    context.assertIncludes(execPlansIndex, 'active/', 'docs/exec-plans/index.md');
    context.assertIncludes(execPlansIndex, 'completed/', 'docs/exec-plans/index.md');
  }

  return {
    passed: true,
    summary: 'Greenfield scaffold produces the minimum harness docs and navigation surface for a fresh repo.',
    findings: [],
  };
}

module.exports = {
  grade,
};
