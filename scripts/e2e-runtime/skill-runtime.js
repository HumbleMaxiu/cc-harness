'use strict';

const fs = require('fs');
const path = require('path');

function readSkill(repoRoot, relPath) {
  const absPath = path.join(repoRoot, relPath);
  const content = fs.readFileSync(absPath, 'utf8');
  return {
    relPath,
    absPath,
    content,
  };
}

function excerpt(content, maxChars = 2400) {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}\n...[truncated]`;
}

function formatTranscript(title, sections) {
  const blocks = [`# ${title}`];
  for (const section of sections) {
    blocks.push(`## ${section.heading}\n\n${section.body.trim()}`);
  }
  return `${blocks.join('\n\n')}\n`;
}

function createSkillStageRunner(context) {
  return {
    loadSkill(relPath) {
      const skill = readSkill(context.repoRoot, relPath);
      context.log(`Loaded skill context from ${relPath}`);
      return skill;
    },
    writePrompt(stageName, skill, promptBody) {
      const content = formatTranscript(`${stageName} Prompt`, [
        {
          heading: 'Skill Source',
          body: `- path: ${skill.relPath}`,
        },
        {
          heading: 'Skill Excerpt',
          body: `\`\`\`md\n${excerpt(skill.content)}\n\`\`\``,
        },
        {
          heading: 'Stage Prompt',
          body: promptBody,
        },
      ]);
      const relPath = `artifacts/runtime/${stageName}/prompt.md`;
      context.write(relPath, content);
      return relPath;
    },
    writeTranscript(stageName, items) {
      const sections = items.map((item) => ({
        heading: item.heading,
        body: item.body,
      }));
      const relPath = `artifacts/runtime/${stageName}/transcript.md`;
      context.write(relPath, formatTranscript(`${stageName} Transcript`, sections));
      return relPath;
    },
  };
}

module.exports = {
  createSkillStageRunner,
};
