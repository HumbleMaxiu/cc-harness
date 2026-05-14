# PM Orchestrator 迁移实施计划

> **面向 agent worker：** 必需入口：使用 `/pm-orchestrator` 作为实施后的执行总控。当前计划本身用于把旧 `/dev-workflow` 迁移为 `/pm-orchestrator`。步骤使用复选框（`- [ ]`）语法跟踪。

**目标：** 新增 Codex-first `/pm-orchestrator`，移除 `/dev-workflow` 公开入口，并把流程控制、skill 分配、失败回流、并行/串行策略交给 PM 总控层。

**架构：** `/pm-orchestrator` 作为 workflow control surface，role skills 保留为可调度能力。文档、AGENTS、README、guides、product specs 和 skill docs 全部指向 PM 总控，不再把 `/dev-workflow` 描述为执行入口。

**技术栈：** Markdown skills、Codex skill frontmatter、cc-harness install script、Node.js skill-standard check。

---

## Run Trace

- trace_id: `2026-05-14-pm-orchestrator-migration`
- current_phase: completed
- docs_impact: high
- verification: grep, skill-standard, skill-audit, install smoke, diff check
- stop_condition: `/pm-orchestrator` 可安装、可审计，活跃文档不再推荐 `/dev-workflow`

## 任务 1：新增 PM Orchestrator Skill

**文件：**
- 创建：`skills/pm-orchestrator/SKILL.md`

- [x] **步骤 1：创建 PM skill frontmatter**

```markdown
---
name: pm-orchestrator
description: PM 总控层。用于计划后或长任务中进行阶段控制、skill 分配、失败回流、并行/串行策略、Run Trace 和交付 gate 编排。
---
```

- [x] **步骤 2：写入执行流程**

覆盖 intake、stage detection、skill routing、execution policy、failure backflow、PM Run Trace、handoff 和 blocked 条件。

- [x] **步骤 3：写入 output contract**

至少包含：

```markdown
### PM Orchestrator Result
- status:
- current_stage:
- assigned_skills:
- waves:
- failures:
- verification:
- docs_impact:
- next_action:
```

## 任务 2：移除 Dev Workflow Source Entry

**文件：**
- 删除：`skills/dev-workflow/SKILL.md`

- [x] **步骤 1：删除旧 skill source**

删除 `skills/dev-workflow/SKILL.md`，让 installer 不再安装旧入口。

- [x] **步骤 2：确认 role skills 保留**

确认 `/architect`、`/developer`、`/reviewer`、`/tester`、`/challenger`、`/feedback-curator` 仍保留为 PM 可调度能力。

## 任务 3：迁移活跃文档引用

**文件：**
- 修改：`README.md`
- 修改：`AGENTS.md`
- 修改：`ARCHITECTURE.md`
- 修改：`docs/guides/project-overview.md`
- 修改：`docs/guides/harness-guide.md`
- 修改：`docs/product-specs/harness-engineering.md`
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/product-specs/skill-system.md`
- 修改：`docs/PLANS.md`
- 修改：`docs/PRODUCT_SENSE.md`
- 修改：`docs/QUALITY_SCORE.md`
- 修改：`docs/feedback/feedback-collection.md`
- 修改：`docs/design-docs/*.md` 中的活跃说明
- 修改：`docs/references/*.md` 中的活跃说明

- [x] **步骤 1：替换核心导航**

将核心 skill 表、典型流程和架构图中的 `/dev-workflow` 替换为 `/pm-orchestrator`。

- [x] **步骤 2：替换职责描述**

将“角色 Skill 驱动开发闭环”替换为“PM 总控按阶段调度 role skills、review packs 和 gates”。

- [x] **步骤 3：保留归档记录**

不批量改写 `docs/exec-plans/completed/` 中历史记录，除非它们被活跃索引当作当前说明使用。

## 任务 4：迁移 Skill 调用说明

**文件：**
- 修改：`skills/writing-plans/SKILL.md`
- 修改：`skills/follow-goal/SKILL.md`
- 修改：`skills/doc-sync/SKILL.md`
- 修改：`skills/harness-guide/SKILL.md`
- 修改：`skills/harness-setup/SKILL.md`
- 修改：`skills/harness-setup/references/file-specs.md`

- [x] **步骤 1：更新 writing-plans handoff**

计划完成后交给 `/pm-orchestrator`，不再提供 `/dev-workflow` 选项。

- [x] **步骤 2：更新 follow-goal 执行入口**

长跑任务通过 `/pm-orchestrator` 维持阶段推进和失败回流。

- [x] **步骤 3：更新 harness setup 和 guide**

新 scaffold 暴露 `/pm-orchestrator`，并把 `/doc-sync` 描述为 PM 可调度或用户可手动运行的入口。

## 任务 5：更新检查脚本和标准说明

**文件：**
- 修改：`scripts/checks/skill-standard.mjs`
- 修改：`skills/skill-audit/scripts/skill-standard.mjs`
- 修改：`docs/references/skill-standard.md`
- 修改：`skills/skill-audit/references/skill-standard.md`

- [x] **步骤 1：key skill 列表改为 pm-orchestrator**

将 `dev-workflow` 从 key skill 列表移除，加入 `pm-orchestrator`。

- [x] **步骤 2：更新 output contract 消费者说明**

把可消费 output contract 的 workflow 从 `/dev-workflow` 改为 `/pm-orchestrator`。

## 任务 6：验证

**命令：**

```bash
rg -n "dev-workflow|/dev workflow|Dev Workflow" README.md AGENTS.md ARCHITECTURE.md docs skills scripts
node scripts/checks/skill-standard.mjs --json
node skills/skill-audit/scripts/skill-standard.mjs --skill pm-orchestrator --json
tmpdir=$(mktemp -d); ./install.sh --target codex --dest "$tmpdir"; test -f "$tmpdir/.codex/skills/pm-orchestrator/SKILL.md"; test ! -e "$tmpdir/.codex/skills/dev-workflow"
git diff --check
```

- [x] **步骤 1：grep 验证**

活跃文档和 skills 不再推荐 `/dev-workflow`。历史 completed plan 可保留旧词。

- [x] **步骤 2：skill 标准验证**

`skill-standard` 和 `skill-audit` 不出现 errors。

- [x] **步骤 3：安装验证**

Codex runtime 安装 `/pm-orchestrator`，不安装 `/dev-workflow`。

- [x] **步骤 4：最终记录**

更新本计划 Run Trace，说明验证结果和剩余风险。

## 验证结果

- `rg`：活跃文档和 skills 中无旧 `/dev-workflow` 调用；仅设计 spec、迁移计划和历史 completed plan 保留旧词作为迁移记录。
- `node scripts/checks/skill-standard.mjs --json`：`23 skills / 0 errors / 117 warnings`。warnings 为历史渐进迁移项。
- `node skills/skill-audit/scripts/skill-standard.mjs --skill pm-orchestrator --json`：`0 errors / 0 warnings`。
- `node --check scripts/checks/skill-standard.mjs && node --check skills/skill-audit/scripts/skill-standard.mjs`：通过。
- `./install.sh --target codex --dest <tmpdir>`：安装后存在 `.codex/skills/pm-orchestrator/SKILL.md` 和 pressure scenarios；不存在 `.codex/skills/dev-workflow`。
- `git diff --check`：通过。
