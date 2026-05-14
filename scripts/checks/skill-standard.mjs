#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const strict = args.has("--strict");
const root = process.cwd();
const skillsDir = path.join(root, "skills");

const keySkills = new Set([
  "architect",
  "challenger",
  "pm-orchestrator",
  "feedback",
  "feedback-curator",
  "follow-goal",
  "harness-quality-gate",
  "harness-setup",
  "reviewer",
  "skill-audit",
  "skill-creator",
  "tester",
]);

const requiredSectionGroups = [
  {
    id: "when_to_use",
    label: "何时使用 / When to Use",
    patterns: [/^##\s+何时使用(?:\s|$)/im, /^##\s+When to Use\b/im],
  },
  {
    id: "when_not_to_use",
    label: "何时不要使用 / When NOT to Use",
    patterns: [/^##\s+何时不要使用(?:\s|$)/im, /^##\s+When NOT to Use\b/im, /^##\s+When Not to Use\b/im],
  },
  {
    id: "inputs",
    label: "输入 / 读取项 / Inputs",
    patterns: [/^##\s+输入(?:\s|$)/im, /^##\s+输入\s*\/\s*读取项(?:\s|$)/im, /^##\s+Inputs?\b/im, /^##\s+Prerequisites\b/im],
  },
  {
    id: "workflow",
    label: "执行流程 / Workflow",
    patterns: [/^##\s+执行流程(?:\s|$)/im, /^##\s+Workflow\b/im, /^##\s+Core Workflow\b/im, /^##\s+Process\b/im, /^##\s+Phases?\b/im, /^##\s+Methodology\b/im],
  },
  {
    id: "output",
    label: "输出格式 / Output",
    patterns: [/^##\s+输出格式(?:\s|$)/im, /^##\s+输出契约(?:\s|$)/im, /^##\s+Output\b/im, /^##\s+Result\b/im, /^##\s+Handoff\b/im, /^###\s+.*Handoff\b/im],
  },
  {
    id: "blocked",
    label: "暂停 / 阻塞条件 / Blocked",
    patterns: [/^##\s+暂停(?:\s|$)/im, /^##\s+暂停\s*\/\s*阻塞条件(?:\s|$)/im, /^##\s+Blocked\b/im, /^##\s+Stop\b/im, /^##\s+Failure\b/im, /^##\s+Escalation\b/im],
  },
];

const sourceRequiredFields = [
  "Source project",
  "Source skill/path",
  "Source URL",
  "License",
  "Imported commit",
  "Import date",
  "Local skill name",
  "Local changes",
  "Compatibility notes",
];

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return { data: {}, body: text, ok: false, error: "missing opening frontmatter fence" };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingIndex === -1) {
    return { data: {}, body: text, ok: false, error: "missing closing frontmatter fence" };
  }

  const data = {};
  for (const line of lines.slice(1, closingIndex)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = unquote(match[2].trim());
  }

  return {
    data,
    body: lines.slice(closingIndex + 1).join("\n"),
    ok: true,
    error: "",
  };
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function isValidSkillName(name) {
  if (typeof name !== "string") return false;
  if (name.length < 1 || name.length > 64) return false;
  if (name.includes("--")) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name);
}

function hasTriggerSemantics(description) {
  return /\buse when\b|\bwhen\b|\basked\b|\basks\b|\bneeds?\b|触发|使用|适用|用于|当用户|当需要/i.test(description);
}

function hasAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasPressureScenario(skillDir, text) {
  const referenceCandidates = [
    path.join(skillDir, "references", "pressure-scenarios.md"),
    path.join(skillDir, "references", "pressure-scenario.md"),
  ];

  if (referenceCandidates.some((candidate) => fs.existsSync(candidate))) return true;
  return /Pressure Scenario|压力场景|rationalization_to_reject|skill-pressure-scenarios|pressure-scenarios\.md|status:\s*exempted/i.test(text);
}

function hasOutputContract(text) {
  return /###\s+(Review|Verification|Skill Creator|Skill Audit|Workflow|Test)\s+(Handoff|Result)|status:\s*(APPROVED|REJECTED|BLOCKED|PASS|WARN|FAIL)/i.test(text);
}

function listSkillDirs() {
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsDir, entry.name))
    .sort();
}

function checkSkill(skillDir) {
  const name = path.basename(skillDir);
  const skillPath = path.join(skillDir, "SKILL.md");
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(skillPath)) {
    errors.push("missing SKILL.md");
    return { name, path: relative(skillPath), errors, warnings };
  }

  const text = readText(skillPath);
  const parsed = parseFrontmatter(text);

  if (!parsed.ok) {
    errors.push(`invalid frontmatter: ${parsed.error}`);
    return { name, path: relative(skillPath), errors, warnings };
  }

  const frontmatterName = parsed.data.name ?? "";
  const description = parsed.data.description ?? "";

  if (!frontmatterName) {
    errors.push("missing required frontmatter field: name");
  } else {
    if (frontmatterName !== name) {
      errors.push(`frontmatter name '${frontmatterName}' does not match directory '${name}'`);
    }
    if (!isValidSkillName(frontmatterName)) {
      errors.push(`invalid skill name '${frontmatterName}'`);
    }
  }

  if (!description) {
    errors.push("missing required frontmatter field: description");
  } else {
    if (description.length > 1024) {
      errors.push("description exceeds 1024 characters");
    }
    if (!hasTriggerSemantics(description)) {
      warnings.push("description may lack trigger semantics");
    }
  }

  for (const group of requiredSectionGroups) {
    if (!hasAnyPattern(text, group.patterns)) {
      warnings.push(`missing recommended section: ${group.label}`);
    }
  }

  const lineCount = text.split(/\r?\n/).length;
  const referencesDir = path.join(skillDir, "references");
  const hasReferences = fs.existsSync(referencesDir);

  if (lineCount > 500 && !hasReferences) {
    warnings.push("SKILL.md exceeds 500 lines without references/");
  }

  if (hasReferences && !/references\//i.test(text)) {
    warnings.push("references/ exists but SKILL.md does not mention references/");
  }

  if (!hasOutputContract(text) && /review|test|workflow|gate|audit|verify|verification|审查|测试|门禁|验证/i.test(name + "\n" + description)) {
    warnings.push("missing visible output contract for review/test/workflow skill");
  }

  if (keySkills.has(name) && !hasPressureScenario(skillDir, text)) {
    warnings.push("key skill has no pressure scenario or explicit exemption");
  }

  checkSourceAttribution(skillDir, text, errors, warnings);
  checkHostCompatibility(text, warnings);

  return { name, path: relative(skillPath), errors, warnings };
}

function checkSourceAttribution(skillDir, text, errors, warnings) {
  const sourcePath = path.join(skillDir, "references", "source.md");
  const hasSourceSection = /^##\s+Source\b/im.test(text);
  const hasSourceFile = fs.existsSync(sourcePath);

  if (hasSourceSection && !hasSourceFile) {
    errors.push("source section present but references/source.md is missing");
    return;
  }

  if (!hasSourceFile) return;

  const source = readText(sourcePath);
  for (const field of sourceRequiredFields) {
    const fieldPattern = new RegExp(`-\\s*${escapeRegExp(field)}\\s*:`, "i");
    if (!fieldPattern.test(source)) {
      errors.push(`references/source.md missing field: ${field}`);
    }
  }

  if (/License:\s*(unknown|tbd|unclear|n\/a)?\s*$/im.test(source)) {
    warnings.push("references/source.md has unclear license status");
  }
}

function checkHostCompatibility(text, warnings) {
  const mentionsClaudeOnly = /Claude Code|\.claude|allowed-tools|\/plugin/i.test(text);
  const mentionsCodexOrCompatibility = /Codex|compatibility|host-specific|Claude Code\s*\/\s*Codex|Claude Code or Codex/i.test(text);

  if (mentionsClaudeOnly && !mentionsCodexOrCompatibility) {
    warnings.push("mentions Claude-specific behavior without Codex compatibility notes");
  }
}

function relative(filePath) {
  return path.relative(root, filePath);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const results = listSkillDirs().map(checkSkill);
const summary = {
  skills: results.length,
  errors: results.reduce((sum, result) => sum + result.errors.length, 0),
  warnings: results.reduce((sum, result) => sum + result.warnings.length, 0),
  strict,
};

if (asJson) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log("Skill Standard Check");
  console.log(`skills: ${summary.skills}`);
  console.log(`errors: ${summary.errors}`);
  console.log(`warnings: ${summary.warnings}`);
  console.log("");

  for (const result of results) {
    if (result.errors.length === 0 && result.warnings.length === 0) continue;
    console.log(`${result.name} (${result.path})`);
    for (const error of result.errors) {
      console.log(`  ERROR: ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`  WARNING: ${warning}`);
    }
    console.log("");
  }

  if (summary.errors === 0 && (!strict || summary.warnings === 0)) {
    console.log("status: PASS");
  } else if (summary.errors === 0) {
    console.log("status: WARN");
  } else {
    console.log("status: FAIL");
  }
}

if (summary.errors > 0 || (strict && summary.warnings > 0)) {
  process.exitCode = 1;
}
