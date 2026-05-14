# cc-harness Skill Standard

> 本标准基于 [skill-standard-research.md](skill-standard-research.md)。规则如果没有外部来源，应在 research 文档中标明来自 `cc-harness` 本地需求。

## Objective

让自研 skill、feedback-generated skill、三方引入 skill 都能按同一套结构创建、审计、安装和维护。标准目标不是让所有 skill 长得一样，而是让 agent 能稳定触发、稳定执行、稳定交付可验证输出。

## Scope

适用于仓库内 `skills/<skill-name>/` 下的所有 `SKILL.md`。

不适用于安装脚本生成的 `.codex/`、`.claude/`、`.claude-plugin/` host runtime 目录。

## Directory Layout

标准结构：

```text
skills/<skill-name>/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

规则：

- `SKILL.md` 是唯一必需文件。
- `references/` 放需要按需读取的 LLM context、长背景、模板说明、source attribution、pressure scenarios。
- `scripts/` 放可执行 helper，必须自包含或清楚说明 dependency。
- `assets/` 放模板、图片、字体、样例文件等输出资源。
- `SKILL.md` 必须直接链接或说明何时读取每个重要 reference / script / asset。
- reference chain SHOULD 保持一跳可达，避免 `SKILL.md -> A -> B -> C`。

## Frontmatter

必需字段：

```yaml
---
name: <skill-name>
description: <能力说明 + 触发场景>
---
```

规则：

- `name` MUST 等于目录名。
- `name` MUST 使用 lowercase letters、digits、hyphen。
- `name` MUST 是 1-64 个字符。
- `name` MUST NOT 以 hyphen 开头或结尾。
- `name` MUST NOT 包含连续 hyphen。
- `description` MUST 非空，且不超过 1024 个字符。
- `description` MUST 同时描述能力和触发场景。
- `description` SHOULD 包含用户可能说出的关键词、任务类型或场景。
- `description` SHOULD 写第三人称或能力描述，不要写成内部实现步骤。
- host-specific frontmatter MAY 出现，但不能成为 Codex / Claude Code 共同运行的必需条件。

## Required Sections

新建或重大修改的 skill SHOULD 包含以下 section。旧 skill 可以逐步补齐，检查脚本第一版会先 warning。

```markdown
## 何时使用
## 何时不要使用
## 输入 / 读取项
## 执行流程
## 输出格式
## 暂停 / 阻塞条件
```

作用：

- `何时使用`：激活后缩小行为边界；不能替代 frontmatter description。
- `何时不要使用`：列出反例和替代入口，避免误触发。
- `输入 / 读取项`：说明要读取哪些 docs、文件、PR、logs、用户输入或外部来源。
- `执行流程`：写 numbered phases；复杂阶段要有 entry / exit criteria。
- `输出格式`：定义 handoff / report / patch / verification result。
- `暂停 / 阻塞条件`：说明何时必须停下来请求用户决策或报告 blocked。

## cc-harness Extensions

### Docs-First Contract

每个 workflow / role / review / test skill SHOULD 说明它读取或维护的 docs。

常见 docs：

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/PLANS.md`
- `docs/product-specs/`
- `docs/design-docs/`
- `docs/exec-plans/`
- `docs/memory/`
- `docs/references/`

如果 skill 不需要读取 docs，也 SHOULD 明确说明“不需要 docs pre-read”，避免 agent 盲目扩大范围。

### Workflow Stage

skill SHOULD 标注主要 stage：

- `vibe coding`
- `AI coding`
- `planning`
- `implementation`
- `review`
- `test`
- `PM orchestration`
- `maintenance`
- `memory / feedback`

一个 skill 可以覆盖多个 stage，但必须说明主路径和边界。

### Output Contract

workflow / review / test 类 skill MUST 输出可消费结果，不能只有散文总结。

Review skill 建议输出：

```markdown
### Review Handoff
- capability:
- source_skill:
- files_reviewed:
- findings:
- risk_level:
- operation_risk:
- required_fixes:
- optional_suggestions:
- evidence:
- status: APPROVED / REJECTED / BLOCKED
```

Verification / test skill 建议输出：

```markdown
### Verification Handoff
- capability:
- source_skill:
- commands_or_checks:
- passed:
- failed:
- logs_or_links:
- required_fixes:
- retry_policy:
- status: APPROVED / REJECTED / BLOCKED
```

Skill creation / audit 建议输出：

```markdown
### Skill Creator Result
- skill_path:
- standard_version:
- generated_sections:
- pressure_scenarios:
- source_attribution:
- audit_status:
- follow_up:
```

### Feedback / Memory Boundary

skill MUST 区分长期 feedback 和当前任务上下文。

长期 feedback 只包括：

- 用户显式要求记录
- 用户评价 workflow / harness / skill 行为
- 会约束未来类似任务的偏好或纠错
- 同类问题 recurrence

当前任务上下文包括：

- 一次性 UI / implementation / test 指令
- 当前验收补充
- 当前 patch 的测试同步说明
- session-only preference

当前任务上下文 MUST NOT 自动写入 `docs/memory/feedback/user-feedback.md`。

### Codex Compatibility

skill MUST NOT 默认只有 Claude Code 可用。

允许写 host-specific 分支，但必须：

- 标明适用 host
- 提供 Codex fallback 或说明 blocked
- 不要求仓库保存 `.codex/`、`.claude/`、`.claude-plugin/`
- 不把 slash command / hook behavior 写成唯一执行方式

### Installable Runtime Portability

本规则只在以下情况强制：

- skill 会安装到 `.codex/skills`、`.claude/skills` 或用户目录
- skill 要跨项目复用或分发给其他用户
- skill 的运行依赖引用了 `skills/<skill-name>/` 目录外的 docs、scripts、assets 或外部文件
- skill 被 PM orchestrator、quality gate、review pack 或 installer 调度

规则：

- 运行必需 references MUST 放在 `skills/<skill-name>/references/`。
- 运行必需 scripts MUST 放在 `skills/<skill-name>/scripts/`。
- 运行必需 assets MUST 放在 `skills/<skill-name>/assets/`。
- repo-level `docs/`、顶层 `scripts/`、临时路径、用户本机路径只能作为 optional supplemental source。
- 如果无法内置依赖，`SKILL.md` MUST 写明 fallback / blocked 条件。
- 创建或重大修改 installable skill 后 SHOULD 运行安装 smoke check，确认安装后的 runtime 中关键 references / scripts 仍存在并可运行。

普通 repo-local、无外部运行依赖的轻量 skill 不需要额外 portability checklist。

### Third-Party Source

三方来源 skill MUST 包含：

- `references/source.md`
- `SKILL.md` 中的 `## Source` 或等价短 section
- source project
- source path / URL
- license
- imported commit / tag
- import date
- local changes
- compatibility notes

License 不清楚或不允许改编时，MUST 只登记候选，不能复制到仓库。

## Pressure Scenarios

重要 skill SHOULD 使用 pressure scenario 验证行为是否真的改变 agent。

必须优先考虑的 skill：

- 约束模型行为的 workflow skill
- feedback / recurrence 生成的 skill
- 三方 review pack
- safety / security / quality gate skill
- 容易被 agent rationalize away 的 discipline skill

最小格式见 [skill-pressure-scenarios.md](skill-pressure-scenarios.md)。

检查脚本第一版对缺失 pressure scenario 只 warning，不 fail。

## Audit Severity

第一版 audit 分级：

- `ERROR`：会导致 skill 无法被稳定发现或来源不可追溯。
- `WARNING`：会降低质量，但不阻塞当前仓库运行。

ERROR：

- 缺少 `SKILL.md`
- 缺少 frontmatter
- 缺少 `name` 或 `description`
- `name` 与目录名不一致
- `name` 不符合格式
- 三方来源 skill 缺少 `references/source.md`

WARNING：

- `description` 没有明确触发语义
- 缺少推荐 section
- 缺少 output contract
- 关键 skill 缺少 pressure scenario 或豁免说明
- `SKILL.md` 超过 500 行但没有 references
- reference file 没有从 `SKILL.md` 一跳可达
- 出现 host-specific 假设但没有 compatibility notes
- installable skill 引用 skill 目录外的运行必需 docs / scripts / assets，却没有 bundled copy 或 blocked 条件

## Manual Check

运行：

```bash
node scripts/checks/skill-standard.mjs
```

可选：

```bash
node scripts/checks/skill-standard.mjs --json
node scripts/checks/skill-standard.mjs --strict
```

`--strict` 会把 warning 也视为失败，适合 PM orchestrator 在 skill health check 场景下选择性启用。

## Adoption Policy

- 新 skill MUST 遵守本标准。
- 重大修改的 skill SHOULD 同步补齐本标准。
- 旧 skill 先接受 warning，后续逐步迁移。
- PM orchestrator 只在创建/修改 skill、引入三方 skill、feedback 生成 skill、显式 skill health check 时调度本标准检查；不作为每次 quality gate 的默认强制项。
