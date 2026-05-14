# Bundled Skill Audit Standard

> 这是 `/skill-audit` 安装后可用的运行时标准摘要。仓库内完整事实源是 `docs/references/skill-standard.md`；安装到用户目录后，如果 repo docs 不存在，使用本文。

## Objective

审计 `skills/<skill-name>/SKILL.md` 是否能被 agent 稳定发现、稳定执行、稳定输出可消费结果。

## Required Layout

```text
skills/<skill-name>/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

`SKILL.md` 是唯一必需文件。`references/`、`scripts/`、`assets/` 只在确实有运行价值时添加。

## Frontmatter

必需字段：

```yaml
---
name: <skill-name>
description: <能力说明 + 触发场景>
---
```

规则：

- `name` 必须等于目录名。
- `name` 使用 lowercase letters、digits、hyphen。
- `name` 长度为 1-64。
- `name` 不能以 hyphen 开头或结尾，不能包含连续 hyphen。
- `description` 必须非空，长度不超过 1024。
- `description` 必须同时描述能力和触发场景。

## Recommended Sections

新建或重大修改的 skill 应包含：

- `## 何时使用`
- `## 何时不要使用`
- `## 输入 / 读取项`
- `## 执行流程`
- `## 输出格式` 或 `## 输出契约`
- `## 暂停 / 阻塞条件`

旧 skill 可以逐步迁移；默认 audit 把缺失项列为 `WARNING`。

## cc-harness Checks

审计时检查：

- docs-first：是否说明读取或维护哪些 docs；如果不需要 docs pre-read，也应明确。
- workflow stage：是否能看出属于 planning、implementation、review、test、PM orchestration、maintenance、memory / feedback 中哪类。
- output contract：workflow / review / test / audit 类 skill 是否输出结构化 handoff 或 result。
- feedback / memory boundary：是否避免把 task-local 指令误写入长期 memory。
- Codex compatibility：是否避免 Claude-only 假设；如有 host-specific 行为，是否说明 fallback。
- installable runtime portability：安装/分发/跨项目复用的 skill 是否把运行必需 references / scripts / assets 放在自身目录内。
- pressure scenarios：关键 skill 是否有 pressure scenario 或豁免理由。
- third-party source：三方来源 skill 是否有 `references/source.md`。

## Installable Runtime Portability

只在以下情况强制：

- skill 会安装到 `.codex/skills`、`.claude/skills` 或用户目录。
- skill 要跨项目复用或分发。
- skill 的运行依赖引用了 `skills/<skill-name>/` 外的 docs、scripts、assets 或外部文件。
- skill 被 PM orchestrator、quality gate、review pack 或 installer 调度。

规则：

- 运行必需 references 放在 `skills/<skill-name>/references/`。
- 运行必需 scripts 放在 `skills/<skill-name>/scripts/`。
- 运行必需 assets 放在 `skills/<skill-name>/assets/`。
- repo-level `docs/`、顶层 `scripts/`、临时路径、用户本机路径只能作为 supplemental source。
- 如果无法内置依赖，`SKILL.md` 必须写明 fallback / blocked 条件。
- 创建或重大修改 installable skill 后，应运行安装 smoke check。

## Severity

`ERROR`：

- 缺少 `SKILL.md`
- 缺少 frontmatter
- 缺少 `name` 或 `description`
- `name` 与目录名不一致
- `name` 格式非法
- 三方来源 skill 缺少 `references/source.md`

`WARNING`：

- `description` 缺少触发语义
- 缺少推荐 section
- 缺少 output contract
- 关键 skill 缺少 pressure scenario 或豁免说明
- `SKILL.md` 超过 500 行但没有 `references/`
- `references/` 存在但 `SKILL.md` 没有说明何时读取
- 出现 host-specific 假设但没有 compatibility notes
- installable skill 引用 skill 目录外的运行必需 docs / scripts / assets，却没有 bundled copy 或 blocked 条件

## Status Mapping

- `PASS`：目标 scope 无 errors，且无需要当前处理的 warnings。
- `WARN`：目标 scope 无 errors，但存在可接受 warnings 或历史迁移债。
- `FAIL`：目标 scope 有 errors，或 strict mode 下有 warnings。
- `BLOCKED`：缺少目标 skill、脚本无法运行、source / license 信息不足，无法可靠判断。
