# Feedback Skill Audit Record

## 背景

本记录保存一次真实 `/skill-audit` 使用结果：用安装后可自包含运行的 `/skill-audit` 审查 `/feedback`。

目标：

- 验证 `/skill-audit` 不依赖 repo-level `docs/references/` 也能运行。
- 验证 bundled `scripts/skill-standard.mjs` 可以按单个 skill scope 审查。
- 记录模型按 `/skill-audit` 输出的审查内容。

## Commands

```bash
node --check skills/skill-audit/scripts/skill-standard.mjs
node skills/skill-audit/scripts/skill-standard.mjs --skill feedback --json
node scripts/checks/skill-standard.mjs --json
./install.sh --target codex --dest <tmpdir>
node <tmpdir>/.codex/skills/skill-audit/scripts/skill-standard.mjs --skills-dir <tmpdir>/.codex/skills --skill feedback --json
```

## Automated Result

```json
{
  "summary": {
    "skills": 1,
    "errors": 0,
    "warnings": 3,
    "strict": false,
    "scope": "feedback",
    "skillsDir": "skills"
  },
  "results": [
    {
      "name": "feedback",
      "path": "skills/feedback/SKILL.md",
      "errors": [],
      "warnings": [
        "missing recommended section: 输入 / 读取项 / Inputs",
        "missing recommended section: 暂停 / 阻塞条件 / Blocked",
        "key skill has no pressure scenario or explicit exemption"
      ]
    }
  ]
}
```

临时 Codex runtime 中运行同一 bundled script，结果一致。

## Model Output

### Skill Audit Result

- scope: `skills/feedback/SKILL.md`
- standard_version: `skills/skill-audit/references/skill-standard.md` bundled standard, with repo-level `docs/references/skill-standard.md` available as supplemental source
- commands_run:
  - `node skills/skill-audit/scripts/skill-standard.mjs --skill feedback --json`
  - `node <tmpdir>/.codex/skills/skill-audit/scripts/skill-standard.mjs --skills-dir <tmpdir>/.codex/skills --skill feedback --json`
- errors:
  - none
- warnings:
  - Missing recommended section: `输入 / 读取项 / Inputs`
  - Missing recommended section: `暂停 / 阻塞条件 / Blocked`
  - Key skill has no pressure scenario or explicit exemption
- pressure_scenarios:
  - missing for `/feedback`
  - recommended first scenario: user gives current UI/test instruction and it must remain task-local instead of being written to long-term feedback memory
- source_attribution:
  - not applicable; `/feedback` is a local cc-harness skill, not a third-party import
- codex_compatibility:
  - no Claude-only requirement found in `/feedback`
  - docs paths are repo-local and expected for cc-harness project runtime
- recommended_fixes:
  - Add `## 输入 / 读取项` to make required docs and memory files explicit.
  - Add `## 暂停 / 阻塞条件` for ambiguous durability, missing memory files, sensitive data, and user requests that conflict with safety or repo policy.
  - Add `skills/feedback/references/pressure-scenarios.md` covering the known UI/test instruction overcapture case.
- status: WARN

## Conclusion

`/feedback` has no blocking `ERROR` and remains usable. It should not fail a non-strict gate. The three warnings are useful migration debt, especially the missing pressure scenario because `/feedback` directly controls long-term memory writes.
