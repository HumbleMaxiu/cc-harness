# Agent Contract Upgrade 设计文档

> **状态**：已实现
> **日期**：2026-04-15

## 目标

升级现有 `architect`、`developer`、`reviewer`、`tester` 四个 agent 的输入/输出契约，使其更适合被 `dev-workflow` 和 `feedback-curator` 稳定编排。

本次设计聚焦两件事：

1. 建立统一的交接文档增强契约
2. 为每个 agent 增加与其职责直接相关的专项能力

## 背景

当前项目已经具备：

- `dev-workflow` 的主流程编排
- `feedback-curator` 的反馈整理与 memory 维护能力
- 基础版的 `architect` / `developer` / `reviewer` / `tester` agent

但现有 agent 仍存在以下问题：

- 交接文档字段过少，主 agent 难以稳定决定下一步
- Reviewer / Tester 对 `feedback-curator` 的输入还不够结构化
- Developer 缺少对 plan task / step 的强约束
- Architect 更像文档维护角色，缺少计划校验和 docs impact 分析

这些问题会导致 workflow 在多轮循环时靠主 agent“猜上下文”，不符合 harness engineering 的可审计、可交接、可恢复原则。

## 设计原则

1. **统一先于专项**：先统一输入/输出契约，再补各角色的专项能力
2. **主 agent 易编排**：交接文档必须足够结构化，让主 agent 不靠推测推进流程
3. **与 feedback-curator 对齐**：Reviewer / Tester 的输出应天然适合 curator 消费
4. **避免职责膨胀**：只增强当前角色职责，不新增无关能力

## 统一交接契约

### 通用输入约定

所有 agent 在执行前，都应尽量获得以下上下文：

- `plan_path`：当前实施计划路径
- `task_id`：当前执行的任务编号或 task 名称
- `step_scope`：本轮执行的步骤范围
- `handoff_source`：上一个角色的交接来源
- `spec_refs`：相关规格或设计文档
- `memory_refs`：本轮需关注的 memory / prevents-recurrence 引用

### 通用输出字段

所有 agent 的交接文档都应尽量包含以下增强字段：

- `plan_path`
- `task_id`
- `step_scope`
- `files_touched`
- `commands_run`
- `artifacts`
- `open_questions`
- `blocking`
- `recurrence_candidate`
- `status`

这些字段不要求所有 agent 完全同构，但必须保证主 agent 能稳定读取出：

- 这轮在做哪一项任务
- 做了什么
- 运行了什么验证
- 是否阻塞
- 是否需要进入 feedback / recurrence 流程

## 各角色专项增强

### Architect

**新增能力：**

- 计划校验清单
  - 是否存在 spec / design doc
  - 是否存在 exec-plan
  - 是否指定了测试路径
  - 是否识别了 docs impact
- 范围确认（scope confirmation）
- 文档影响矩阵（docs impact matrix）

**输出增强：**

- 当前计划是否可执行
- 哪些文档需要同步
- 哪些文档是否暂时无需更新

### Developer

**新增能力：**

- 按 `task_id` / `step_scope` 执行，而不是笼统按整份计划执行
- 明确汇报本轮完成了哪些 checkbox
- 明确汇报哪些未完成，以及未完成原因
- 结构化自检结果

**输出增强：**

- `completed_steps`
- `remaining_steps`
- `self_check`
  - `test_commands`
  - `lint_commands`
  - `typecheck_commands`
  - `result`
  - `failure_summary`

### Reviewer

**新增能力：**

- 问题分为阻塞 / 非阻塞
- 为发现补充 `severity` 与 `confidence`
- 检查是否违反：
  - spec / design
  - exec-plan
  - prevents-recurrence
- 判断是否应升级为 recurrence 候选

**输出增强：**

- findings 列表化
- 每条 finding 带：
  - `blocking`
  - `severity`
  - `confidence`
  - `evidence`
  - `violates`
- `Feedback Record` 与 findings 对齐

### Tester

**新增能力：**

- 测试矩阵意识
  - unit
  - integration
  - regression
  - lint
  - typecheck
- 复现命令和环境假设
- 未覆盖风险说明
- 阻塞 / 非阻塞区分

**输出增强：**

- `test_matrix`
- `commands_run`
- `environment_assumptions`
- `coverage_gaps`
- `blocking`

## 与 Feedback Curator 的衔接

Reviewer / Tester 的增强输出必须让 `feedback-curator` 能直接消费：

- 明确本条问题是否阻塞
- 明确建议处理方式
- 明确是否是 recurrence candidate
- 明确证据来源

这样 curator 不需要从长段自然语言中二次猜测结构。

## 与 Dev Workflow 的衔接

`dev-workflow` 的统一交接文档格式应升级为“公共骨架 + 角色专项字段”。

推荐模式：

```markdown
## 交接：[from] → [to]

### 任务上下文
- plan_path: ...
- task_id: ...
- step_scope: ...
- spec_refs: ...

### 完成内容
- files_touched: ...
- commands_run: ...
- artifacts: ...

### 结果
- status: APPROVED / REJECTED / BLOCKED
- blocking: true / false

### 角色专项输出
- ...

### Open Questions
- ...

### Feedback Record
...
```

## 文件范围

本次实现预计涉及：

- `.claude/agents/architect.md`
- `.claude/agents/developer.md`
- `.claude/agents/reviewer.md`
- `.claude/agents/tester.md`
- `docs/design-docs/architect.md`
- `docs/design-docs/developer.md`
- `docs/design-docs/reviewer.md`
- `docs/design-docs/tester.md`
- `skills/dev-workflow/SKILL.md`
- `.claude/skills/dev-workflow/SKILL.md`
- `docs/product-specs/agent-system.md`

## 风险与缓解

### 风险 1：字段过多导致执行成本变高

**缓解：**
- 只保留主 agent 真正会消费的字段
- 使用“公共骨架 + 角色专项字段”，而不是所有 agent 全量同构

### 风险 2：Reviewer / Tester 输出过复杂，反而不稳定

**缓解：**
- 只要求高信心问题进入 blocking findings
- `severity` / `confidence` 只服务决策，不追求过度形式化

### 风险 3：Developer 被过度束缚，降低灵活性

**缓解：**
- 强约束聚焦于 `task_id` / `step_scope` 和结果汇报
- 不要求死板逐行照抄计划

## 实施范围

本次实现包含：

1. 四个 agent 定义升级
2. 对应 design-doc 页面同步
3. `dev-workflow` 的统一交接骨架升级
4. 产品规格同步

本次实现不包含：

1. 新增额外 agent
2. 自动从交接文档生成结构化 JSON
3. 独立脚本或数据库来校验交接字段
