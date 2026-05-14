#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillsDir = path.resolve(scriptDir, "..", "..");
const options = parseArgs(process.argv.slice(2));
const skillsDir = path.resolve(options.skillsDir || defaultSkillsDir);
const root = path.dirname(skillsDir);

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

const sectionGroups = [
  {
    label: "何时使用 / When to Use",
    patterns: [/^##\s+何时使用(?:\s|$)/im, /^##\s+When to Use\b/im],
  },
  {
    label: "何时不要使用 / When NOT to Use",
    patterns: [/^##\s+何时不要使用(?:\s|$)/im, /^##\s+When NOT to Use\b/im, /^##\s+When Not to Use\b/im],
  },
  {
    label: "输入 / 读取项 / Inputs",
    patterns: [/^##\s+输入(?:\s|$)/im, /^##\s+输入\s*\/\s*读取项(?:\s|$)/im, /^##\s+Inputs?\b/im, /^##\s+Prerequisites\b/im],
  },
  {
    label: "执行流程 / Workflow",
    patterns: [/^##\s+执行流程(?:\s|$)/im, /^##\s+Workflow\b/im, /^##\s+Core Workflow\b/im, /^##\s+Process\b/im, /^##\s+Phases?\b/im, /^##\s+Methodology\b/im],
  },
  {
    label: "输出格式 / 输出契约 / Output",
    patterns: [/^##\s+输出格式(?:\s|$)/im, /^##\s+输出契约(?:\s|$)/im, /^##\s+Output\b/im, /^##\s+Result\b/im, /^##\s+Handoff\b/im, /^###\s+.*Handoff\b/im],
  },
  {
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

function parseArgs(argv) {
  const parsed = {
    json: false,
    strict: false,
    skill: "",
    skillsDir: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--strict") {
      parsed.strict = true;
    } else if (arg === "--skill") {
      parsed.skill = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--skills-dir") {
      parsed.skillsDir = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return { ok: false, data: {}, error: "missing opening frontmatter fence" };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingIndex === -1) {
    return { ok: false, data: {}, error: "missing closing frontmatter fence" };
  }

  const data = {};
  for (const line of lines.slice(1, closingIndex)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = unquote(match[2].trim());
  }

  return { ok: true, data, error: "" };
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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
  const candidates = [
    path.join(skillDir, "references", "pressure-scenarios.md"),
    path.join(skillDir, "references", "pressure-scenario.md"),
  ];
  if (candidates.some((candidate) => fs.existsSync(candidate))) return true;
  return /Pressure Scenario|压力场景|rationalization_to_reject|skill-pressure-scenarios|pressure-scenarios\.md|status:\s*exempted/i.test(text);
}

function hasOutputContract(text) {
  return /###\s+(Review|Verification|Skill Creator|Skill Audit|Workflow|Test|Feedback)\s+(Handoff|Result|Capture|Triage)|status:\s*(APPROVED|REJECTED|BLOCKED|PASS|WARN|FAIL)|route:\s|captured:\s/i.test(text);
}

function listSkillDirs() {
  if (!fs.existsSync(skillsDir)) return [];
  const dirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsDir, entry.name))
    .sort();

  if (!options.skill) return dirs;
  return dirs.filter((dir) => path.basename(dir) === options.skill);
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

  const text = fs.readFileSync(skillPath, "utf8");
  const parsed = parseFrontmatter(text);
  if (!parsed.ok) {
    errors.push(`invalid frontmatter: ${parsed.error}`);
    return { name, path: relative(skillPath), errors, warnings };
  }

  const frontmatterName = parsed.data.name || "";
  const description = parsed.data.description || "";

  if (!frontmatterName) {
    errors.push("missing required frontmatter field: name");
  } else {
    if (frontmatterName !== name) errors.push(`frontmatter name '${frontmatterName}' does not match directory '${name}'`);
    if (!isValidSkillName(frontmatterName)) errors.push(`invalid skill name '${frontmatterName}'`);
  }

  if (!description) {
    errors.push("missing required frontmatter field: description");
  } else {
    if (description.length > 1024) errors.push("description exceeds 1024 characters");
    if (!hasTriggerSemantics(description)) warnings.push("description may lack trigger semantics");
  }

  for (const group of sectionGroups) {
    if (!hasAnyPattern(text, group.patterns)) warnings.push(`missing recommended section: ${group.label}`);
  }

  const referencesDir = path.join(skillDir, "references");
  if (text.split(/\r?\n/).length > 500 && !fs.existsSync(referencesDir)) {
    warnings.push("SKILL.md exceeds 500 lines without references/");
  }
  if (fs.existsSync(referencesDir) && !/references\//i.test(text)) {
    warnings.push("references/ exists but SKILL.md does not mention references/");
  }

  if (!hasOutputContract(text) && /review|test|workflow|gate|audit|verify|verification|feedback|审查|测试|门禁|验证|反馈/i.test(`${name}\n${description}`)) {
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

  const source = fs.readFileSync(sourcePath, "utf8");
  for (const field of sourceRequiredFields) {
    if (!new RegExp(`-\\s*${escapeRegExp(field)}\\s*:`, "i").test(source)) {
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

function usage() {
  return [
    "Usage: node skills/skill-audit/scripts/skill-standard.mjs [--json] [--strict] [--skill <name>] [--skills-dir <path>]",
    "",
    "Defaults to the sibling skills directory so the script works after cc-harness installation.",
  ].join("\n");
}

if (options.help) {
  console.log(usage());
  process.exit(0);
}

const results = listSkillDirs().map(checkSkill);
if (options.skill && results.length === 0) {
  results.push({
    name: options.skill,
    path: relative(path.join(skillsDir, options.skill, "SKILL.md")),
    errors: [`skill not found: ${options.skill}`],
    warnings: [],
  });
}

const summary = {
  skills: results.length,
  errors: results.reduce((sum, result) => sum + result.errors.length, 0),
  warnings: results.reduce((sum, result) => sum + result.warnings.length, 0),
  strict: options.strict,
  scope: options.skill || "all",
  skillsDir: relative(skillsDir),
};

if (options.json) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log("Skill Standard Check");
  console.log(`scope: ${summary.scope}`);
  console.log(`skills: ${summary.skills}`);
  console.log(`errors: ${summary.errors}`);
  console.log(`warnings: ${summary.warnings}`);
  console.log("");
  for (const result of results) {
    if (result.errors.length === 0 && result.warnings.length === 0) continue;
    console.log(`${result.name} (${result.path})`);
    for (const error of result.errors) console.log(`  ERROR: ${error}`);
    for (const warning of result.warnings) console.log(`  WARNING: ${warning}`);
    console.log("");
  }
  console.log(summary.errors === 0 && (!options.strict || summary.warnings === 0) ? "status: PASS" : summary.errors === 0 ? "status: WARN" : "status: FAIL");
}

if (summary.errors > 0 || (options.strict && summary.warnings > 0)) {
  process.exitCode = 1;
}
