---
name: doc-sync
description: 基于代码、配置、agent、skill、workflow 变更进行文档影响分析、同步更新、索引维护与结果落账。用于：源码改动后的 docs 同步、架构变更后的文档补齐、release 前文档扫尾，或用户要求维护 AGENTS.md、ARCHITECTURE.md、design docs、product specs、memory/feedback 文档。
---

# Doc Sync

用于在仓库发生变更后，系统化检查并同步相关文档。

这个 Skill 不是通用写作入口，而是一个“基于变更的文档同步执行器”：

- 检查哪些文档应受影响
- 更新需要同步的文档
- 在新增文档时补齐 index / nav / cross-link
- 输出结构化同步结果

## 何时使用

当出现以下任一情况时使用：

- 修改了源码、配置、agent、skill、workflow
- 修改了架构边界、角色职责或 workflow 规则
- 用户要求“同步文档”“补齐 design doc”“维护 AGENTS.md / ARCHITECTURE.md”
- `dev-workflow` 进入 `Doc Sync` 阶段
- `Architect` 完成 `docs impact matrix` 后需要执行文档维护

## 何时不要使用

以下场景不应默认使用本 Skill：

- 从零撰写长篇 PRD、营销文案或任意说明文
- 与当前仓库变更无关的大规模知识库整理
- 只需要做轻量问题探索，还没有形成明确变更

这类任务应交给更合适的写作或规划 workflow。

## 快速流程

1. 读取 [references/doc-sync-scope.md](references/doc-sync-scope.md)，确认本次需要关注的文档层级
2. 读取 [references/doc-impact-matrix.md](references/doc-impact-matrix.md)，整理或消费已有 `docs_impact_matrix`
3. 按 [references/sync-checklist.md](references/sync-checklist.md) 逐项检查
4. 如需更新，遵循 [references/doc-update-rules.md](references/doc-update-rules.md)
5. 输出统一的 `Doc Sync Result`

## 输入契约

优先使用以下输入：

```markdown
### Doc Sync Input
- trigger_mode: direct / workflow
- plan_path:
- task_id:
- change_summary:
- files_touched:
- spec_refs:
- design_refs:
- architecture_refs:
- docs_impact_matrix:
- required_updates:
- constraints:
```

如果上游没有提供完整结构化输入，也至少要尽量明确：

- 变更了哪些文件
- 变更意图是什么
- 哪些文档可能受影响

## 输出契约

完成后必须输出：

```markdown
### Doc Sync Result
- docs_checked:
- docs_updated:
- reviewed_no_change:
- missing_docs:
- follow_up_needed:
- nav_or_index_updated:
- architecture_sync_status:
- status: completed / partial / blocked
```

要求：

- `reviewed_no_change` 必须是合法结果，避免无意义改动
- 如果新增了文档，必须显式说明是否同步了 index / nav
- 如果本轮不适合立即补齐，写入 `follow_up_needed`

## 与 workflow 的衔接

### 作为顶级 Skill

用户直接调用时，本 Skill 自行完成最小文档影响分析，然后执行同步。

### 作为 `dev-workflow` 阶段

`Doc Sync` 阶段应直接套用本 Skill 的输入输出契约，而不是自由发挥。

### 作为 `Architect` 的执行器

`Architect` 负责：

- 识别 `docs impact`
- 产出 `docs impact matrix`
- 判断是否涉及架构层文档

本 Skill 负责：

- 检查与更新文档
- 同步 index / nav / cross-link
- 输出 `Doc Sync Result`

## 执行边界

默认只处理与当前变更直接相关的以下位置：

- `docs/product-specs/`
- `docs/design-docs/`
- `docs/exec-plans/` 与相关 index
- `docs/memory/`
- `docs/feedback/`
- `AGENTS.md`
- `ARCHITECTURE.md`

如果变更超出这些边界，先说明理由，再决定是否扩展检查范围。
