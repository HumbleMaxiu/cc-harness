# Doc Sync Skill 设计文档

> **状态**：草稿
> **日期**：2026-04-15

## 目标

定义一个可被用户直接调用、也可被 `dev-workflow` 与 `Architect` 复用的顶级 Skill：`/doc-sync`，将现有分散在 agent prompt、workflow 阶段和项目规则中的“文档维护”能力抽离为独立、可复用、可演进的能力模块。

本设计希望解决三件事：

1. 让文档维护不再只是 `Architect` 的附属职责
2. 让 Skill 模式与 Subagent 模式使用同一套文档同步标准
3. 让“检查后无需更新”也成为结构化、可审计的显式结果

## 背景

当前仓库已经明确要求源码变更后进行文档同步，但职责分布仍较分散：

- `AGENTS.md` 要求编辑源码后检查对应 docs 是否需要同步
- `dev-workflow` Skill 模式已定义 `Doc Sync` 阶段
- `Architect` agent 在开发完成后负责维护 `docs/`、`AGENTS.md` 和必要的架构文档

这说明“文档同步”已经是稳定能力，而不是一次性提醒。但它目前仍存在以下问题：

1. 判断规则分散在多个 prompt / 文档中，复用性差
2. Skill 模式与 Subagent 模式虽都涉及文档维护，但没有统一执行契约
3. `Architect` 同时承担计划校验、架构判断、文档执行，职责偏重
4. 文档检查结果缺少统一输出格式，不利于恢复、审计和后续自动化

## 设计结论

### 结论 1：文档维护能力应独立

文档维护应从 `Architect` 的角色描述中抽离出来，形成独立能力单元，而不是继续依赖角色 prompt 临场发挥。

### 结论 2：应提供用户顶级 Skill

`/doc-sync` 应作为用户顶级 Skill 存在，而不是仅作为 `dev-workflow` 的内部子 skill。

原因：

- 它不仅服务 Skill 模式，也服务 Subagent 模式
- 用户存在独立的文档维护、知识库扫尾、架构文档补齐场景
- 顶级入口更符合“文档维护是稳定能力”的产品表达

### 结论 3：Architect 仍保留 gatekeeper 职责

文档维护被抽离后，`Architect` 不消失，而是职责收敛为：

- 识别 `docs impact`
- 产出 `docs impact matrix`
- 判断是否涉及架构层文档
- 在 workflow 中触发 `/doc-sync`

也就是说：

- `Architect` 负责判断与编排
- `/doc-sync` 负责执行与记录

## 设计原则

### 1. 统一标准，跨模式复用

Skill 模式中的 `Doc Sync` 阶段与 Subagent 模式中 `Architect` 的收尾文档维护，应使用同一套输入、检查项与输出结构。

### 2. 允许“检查后无需修改”

文档维护不是强迫修改文档，而是要求显式检查。应允许输出：

- `docs_updated`
- `reviewed_no_change`
- `follow_up_needed`

以避免 agent 为了“表现完成”而做无意义修改。

### 3. 区分判断职责与执行职责

是否需要同步哪些文档，通常依赖任务范围、代码变更和架构影响分析；这属于 `Architect` 或 workflow gate 的判断职责。实际文档检查与更新属于执行职责，不应全部压在 `Architect` prompt 内。

### 4. 顶级入口不等于任意写作入口

`/doc-sync` 的定位不是通用写作或任意文档创作，而是：

> 基于现有变更进行文档影响分析、同步更新、索引维护与结果落账

因此它的范围应当明确、收敛。

## Skill 定位

### 适用场景

- 代码、配置、agent、skill、workflow 变更后的文档同步
- release 前的文档扫尾
- 架构调整后的文档补齐
- 独立进行 docs / index / nav 一致性维护

### 非适用场景

- 从零撰写长篇产品文案
- 与仓库变更无关的大规模知识库整理
- 泛化的编辑、润色或营销文案工作

这类需求应由其他 skill 或专门 workflow 承担，而不是扩大 `/doc-sync` 的边界。

## 范围

`/doc-sync` 第一版建议覆盖以下文档层：

- `docs/product-specs/`
- `docs/design-docs/`
- `docs/exec-plans/` 与相关 index
- `docs/memory/`
- `docs/feedback/`
- `AGENTS.md`
- `ARCHITECTURE.md`

对于上面这些位置，Skill 负责：

- 判断是否需要检查
- 判断是否需要更新
- 如新增文档，补齐相关 index / nav / cross-link
- 输出结构化结果

## 信息架构

建议新增：

```text
skills/doc-sync/
  SKILL.md
  references/
    doc-sync-scope.md
    doc-impact-matrix.md
    sync-checklist.md
    doc-update-rules.md
```

设计意图：

- `SKILL.md`：说明何时使用、如何执行、最终输出格式
- `doc-sync-scope.md`：定义哪些文档类型属于本 skill
- `doc-impact-matrix.md`：定义输入/判断口径
- `sync-checklist.md`：定义最小检查清单
- `doc-update-rules.md`：定义新增文档、索引同步、无需修改时的记录规则

为避免双份维护，`dev-workflow` 不应再单独维护一份同构的内部 `doc-sync` skill，而应直接引用该顶级 skill 的契约。

## 输入契约

`/doc-sync` 应接受一份最小结构化输入：

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

字段说明：

- `trigger_mode`
  - `direct`：用户直接调用
  - `workflow`：由 `dev-workflow` 或 `Architect` 调用
- `change_summary`
  - 用简短语言概括本轮变更
- `files_touched`
  - 作为文档影响分析的事实来源
- `docs_impact_matrix`
  - 由上游明确哪些文档应更新、哪些需检查、哪些可暂不处理
- `required_updates`
  - 用于表达必须补齐的同步项

若为用户直接调用，Skill 可自行补足部分分析；若为 workflow 调用，上游应优先传入结构化 `docs_impact_matrix`，减少重复推断。

## 输出契约

`/doc-sync` 应输出统一结果：

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

补充约束：

- `docs_checked`：列出已检查的文档或文档类别
- `docs_updated`：列出实际更新的文档
- `reviewed_no_change`：列出已评估、确认暂不修改的文档
- `missing_docs`：列出按规则应存在但尚不存在的文档
- `follow_up_needed`：列出当前不适合立即补齐的后续项
- `architecture_sync_status`：明确架构文档是已同步、无需变更还是待确认

## 核心检查清单

第一版应固定执行以下检查：

1. 是否存在受影响的 product spec
2. 是否存在受影响的 design doc
3. 是否需要新增或更新 `ARCHITECTURE.md`
4. 是否需要同步 `AGENTS.md` 中的导航、规则或角色说明
5. 是否需要更新相关 index 页面
6. 是否有 memory / feedback 规则受本轮变更影响
7. 若本轮无法安全修改，是否需要在 exec-plan 或 handoff 中记录 follow-up

这个 checklist 应保持简洁，优先覆盖高频同步缺口，而不是把所有可能文档都列成长表。

## 与 Architect 的关系

`Architect` 应从“文档维护执行者”调整为“文档同步 gatekeeper”。

推荐职责分工：

- `Architect`
  - 计划检查
  - 范围确认
  - docs impact 分析
  - 判断架构层影响
  - 决定是否触发 `/doc-sync`
- `/doc-sync`
  - 文档检查
  - 文档更新
  - index / nav / cross-link 同步
  - 结构化结果输出

这样可以减少 `Architect` prompt 的职责膨胀，同时让文档维护行为更稳定、可复用。

## 与 dev-workflow 的关系

### Skill 模式

保留现有 `Doc Sync` 阶段，但该阶段的语义应升级为：

> 调用 `/doc-sync` 或显式套用其契约完成文档同步

也就是说，`Doc Sync` 不再是自由发挥阶段，而是受顶级 skill 契约约束的标准阶段。

### Subagent 模式

推荐流程：

1. `Developer` / `Reviewer` / `Tester` 完成主要任务
2. `Architect` 汇总 `files_touched`、`change_summary`、`docs_impact_matrix`
3. `Architect` 触发 `/doc-sync`
4. 将 `Doc Sync Result` 并入最终 handoff

这样 Skill 模式与 Subagent 模式共享同一文档维护协议，而不是分别实现两套相似逻辑。

## 触发规则

建议将以下规则写入相关 workflow / agent 契约：

- 修改源码、配置、agent、skill、workflow 后，必须做 `docs impact check`
- 如 `docs_impact_matrix` 判定存在影响，必须执行 `/doc-sync`
- 即使判定无需修改，也必须记录 `reviewed_no_change`
- 如新增文档，必须同步 index / nav
- 如属于架构变更，必须检查 `ARCHITECTURE.md` 与相关 design doc

## 风险与边界

### 风险 1：顶级 Skill 过宽

如果把 `/doc-sync` 定义成“所有文档工作都能做”，会迅速膨胀成通用写作入口。

缓解：

- 明确只处理“基于变更的同步”
- 不承诺承担泛化写作任务

### 风险 2：与 Architect 职责重叠

若不重新界定职责，`Architect` 与 `/doc-sync` 可能都在做文档判断和执行。

缓解：

- `Architect` 聚焦判断与 gate
- `/doc-sync` 聚焦执行与记录

### 风险 3：检查成本过高

若 checklist 过长，用户与 agent 都会倾向于跳过。

缓解：

- 第一版只覆盖高频文档层
- 把“查过但不改”作为合法结果

## 实施建议

建议按以下顺序落地：

1. 新增 `skills/doc-sync/SKILL.md`
2. 新增配套 references，固定 scope、impact matrix、checklist、update rules
3. 更新 `skills/dev-workflow/SKILL.md`，使 `Doc Sync` 阶段引用 `/doc-sync` 契约
4. 更新 `docs/design-docs/architect.md` 与 `.claude/agents/architect.md`，将职责改为“判定并触发 `/doc-sync`”
5. 更新 `docs/product-specs/agent-system.md`，把 `/doc-sync` 纳入跨模式共享能力
6. 如有必要，再补充到 `docs/HARNESS_METHODOLOGY.md` 或 `AGENTS.md`

## 非目标

本设计不包含：

1. 自动从代码 diff 生成完整文档修改内容
2. 将所有 docs 规则都编码成脚本化 check
3. 新增独立的“文档 reviewer” agent
4. 处理与仓库变更无关的通用文档创作

## 一句话总结

`/doc-sync` 应成为一个用户可见、跨 workflow 复用的顶级 Skill：由 `Architect` 负责判断和触发，由 Skill 负责执行和记录，从而把当前分散的文档维护规则收敛为统一、可审计、可演进的产品能力。
