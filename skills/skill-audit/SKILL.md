---
name: skill-audit
description: Audit cc-harness skills against the Skill Standard. Use when users ask to review, audit, validate, health-check, or gate one or more skills, and when PM orchestration needs a skill quality gate before accepting skill changes or third-party skill imports.
---

# Skill Audit

Audit `cc-harness` skills against the repository Skill Standard and report actionable `ERROR` / `WARNING` findings.

## 何时使用

- 用户要求审计、检查、review、validate、health-check 一个或多个 skill。
- 用户引入或改造三方 skill，需要确认 source attribution、license 和 Codex compatibility。
- 用户从 feedback / recurrence 生成 skill，需要确认 pressure scenario 和 memory boundary。
- `/skill-creator` 生成或修改 skill 后，需要独立审计结果。
- PM orchestrator 在 skill 相关质量门禁中需要调度 skill quality gate。

## 何时不要使用

- 不用于普通代码 review；使用 `/reviewer` 或专项 review pack。
- 不用于整体 harness 健康检查；使用 `/harness-audit`。
- 不用于交付前全量质量门禁；使用 `/harness-quality-gate`，再由 PM 或用户决定是否追加 `/skill-audit`。
- 不直接创建或重写 skill；创建和重构优先使用 `/skill-creator`，本 skill 只输出审计结论和修复建议。

## 输入 / 读取项

必读：

- `references/skill-standard.md`
- `scripts/skill-standard.mjs`
- 目标 `skills/<skill-name>/SKILL.md`

按需读取：

- `references/standard-sources.md`
- `references/pressure-scenarios.md`
- 仓库内存在时可补充读取 `docs/references/skill-standard.md`
- 仓库内存在时可补充读取 `docs/references/skill-standard-research.md`
- 仓库内存在时可补充读取 `docs/references/review-pack-registry.md`
- 三方来源 skill 的 `skills/<skill-name>/references/source.md`
- 目标 skill 的 `references/pressure-scenarios.md`

## 执行流程

1. **确定范围**
   - 如果用户指定 skill，只审计指定路径。
   - 如果用户要求全量 health check，审计 `skills/*/SKILL.md`。
   - 如果是 PM gate，默认只审计本次变更涉及的 skill；无法确定范围时再全量扫描。

2. **读取标准**
   - 优先读取本 skill 自带的 `references/skill-standard.md`。
   - 如果当前仓库存在 `docs/references/skill-standard.md`，可把它作为更完整的 repo-level 事实源。
   - 如涉及三方来源、review pack 或 feedback-generated skill，再读取相关 reference。

3. **运行自动检查**
   - 默认运行 `node skills/skill-audit/scripts/skill-standard.mjs`。
   - 需要 machine-readable 结果时运行 `node skills/skill-audit/scripts/skill-standard.mjs --json`。
   - 如果用户指定单个 skill，运行 `node skills/skill-audit/scripts/skill-standard.mjs --skill <name> --json`。
   - 只有用户或 PM gate 明确要求严格模式时，才追加 `--strict`。
   - 如果当前环境不是 repo root，需要用 `--skills-dir <path>` 指向 skills 目录。

4. **补充人工判断**
   - 检查 description 是否真实覆盖触发场景，而不是只过正则。
   - 检查 output contract 是否能被 `/pm-orchestrator`、`/harness-quality-gate` 或相关 review / verification gate 消费。
   - 检查 docs-first、feedback/memory boundary、Codex compatibility 是否清楚。
   - 三方来源 skill 必须检查 `references/source.md` 是否包含 source project、source URL、license、imported commit、local changes 和 compatibility notes。

5. **分级处理**
   - `ERROR`：阻塞 skill 质量门禁，必须修复后再接受。
   - `WARNING`：记录为迁移债或建议修复；默认不阻塞，除非运行 strict gate。
   - `BLOCKED`：缺少文件、缺少上下文或 license 状态不清，无法给出可靠结论。

6. **输出结果**
   - 使用 `Skill Audit Result`。
   - 明确自动检查命令、error 数、warning 数、是否 strict、是否可进入下一阶段。
   - 指定单个 skill 时，status 只由目标 skill 的 errors / warnings 决定；全仓库历史 warnings 只能作为背景说明。

## 输出格式

```markdown
### Skill Audit Result
- scope:
- standard_version:
- commands_run:
- errors:
- warnings:
- pressure_scenarios:
- source_attribution:
- codex_compatibility:
- recommended_fixes:
- status: PASS / WARN / FAIL / BLOCKED
```

状态含义：

- `PASS`：无 errors，且无需要当前处理的 warnings。
- `WARN`：无 errors，但存在可接受的 warnings 或历史迁移债。
- `FAIL`：存在 errors，或 strict mode 下存在 warnings。
- `BLOCKED`：缺少必要信息，无法判断。

## 暂停 / 阻塞条件

- `scripts/skill-standard.mjs` 不存在或无法运行。
- 目标 skill 不存在。
- 三方来源 skill 缺少 license 信息，且用户要求复制或发布该 skill。
- 用户要求 strict gate，但当前仓库存在 unrelated historical warnings；需要先确认审计范围。
- 用户指定单个 skill，但目标 skill 无法在 `--json` 结果中定位。
- 自动检查结果和人工判断冲突，且会影响是否阻塞 PM gate。

## Pressure Scenarios

本 skill 的行为验证场景见 `references/pressure-scenarios.md`。
