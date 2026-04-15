---
name: dev-workflow
description: 开发流程 agent 系统。包含 A/Dev/R/T 四种角色，支持 Skill/Subagent/Team 三种模式。接在 writing-plans 之后。
---

# Dev Workflow Agent System

开发流程 agent 系统，遵循 harness engineering 原则。
接在 `writing-plans` 技能之后使用。

## 角色

| 角色 | Agent | 职责 |
|------|-------|------|
| 架构师 | architect | 任务开始前检查计划，开发完成后维护文档 |
| 开发者 | developer | TDD 实现功能 |
| 审查者 | reviewer | 代码审查，质量把关 |
| 测试工程师 | tester | 测试验证 |
| 反馈整理员 | feedback-curator | 整理 `Feedback Record`，维护 feedback memory，输出用户决策摘要 |

## 三种开发模式

### Skill 模式

**适用场景**：单一任务、步骤明确、不需要循环审查

**执行方式**：主 agent 直接执行各阶段

### Subagent 模式

**适用场景**：需要循环审查、有状态追踪需求

**执行方式**：
1. 主 agent 读取 `.claude/agents/` 中的 agent 定义
2. 用自然语言传递上下文给 subagent
3. Subagent 完成后主 agent 读取结果，决定下一步
4. 每个角色完成后写交接文档
5. 如交接文档包含 `Feedback Record`，主 agent 应触发 `feedback-curator` 维护 `docs/memory/feedback/agent-feedback.md`
6. 阻塞型反馈立即进入用户决策点，非阻塞建议可在任务收尾时统一询问用户

### Team 模式

**适用场景**：需要多角度并行审查

**执行方式**：
1. 主 agent 创建 Agent Team
2. 多个 Reviewer 并行审查同一份代码
3. 结果汇总给主 agent

## Subagent 模式调用流程

### 单任务循环

```
主 agent
    ↓
Architect 检查计划文档
    ↓
Dev 实现
    ↓
Reviewer 审查
    ↓
Feedback Curator 记录反馈并输出摘要
    ↓ [REJECTED]
用户决策点
    ↓ [继续修复]
Dev 实现
    ↓ [APPROVED]
Tester 测试
    ↓
Feedback Curator 记录反馈并输出摘要
    ↓ [REJECTED]
用户决策点
    ↓ [继续修复]
Dev 实现
    ↓
[通过] → Architect 维护文档
    ↓
交付
```

### 循环定义

| 循环 | 条件 | 动作 |
|------|------|------|
| Dev → Reviewer | REJECTED | `feedback-curator` 记录阻塞反馈，主 agent 立即询问用户是否修复后继续 |
| Dev → Reviewer | APPROVED | 进入 Tester |
| Tester | REJECTED | `feedback-curator` 记录阻塞反馈，主 agent 立即询问用户是否修复后继续 |
| Tester | APPROVED | 进入 Architect 维护 |

**终止条件**：Reviewer APPROVED + Tester APPROVED

### 并行审查

- 可临时起意开启多个 Reviewer 并行审查同一份代码
- 结果汇总给主 agent

## Team 模式调用流程

```
主 agent
    ↓
创建 Agent Team
    ↓
多个 Reviewer 并行审查
    ↓
结果汇总
    ↓
后续流程同 Subagent 模式
```

## 交接文档

每个角色完成后必须写交接文档，格式见下方统一格式。
交接文档用于主 agent 读取结果、决定下一步操作。
开始执行前，主 agent 应先读取 `docs/memory/index.md` 和 `docs/memory/feedback/prevents-recurrence.md`。

## 反馈决策规则

- **阻塞型反馈**：Reviewer 或 Tester 给出 `REJECTED` 时，主 agent 必须先触发 `feedback-curator` 记录到 `docs/memory/feedback/agent-feedback.md`，状态为 `pending`，然后立即向用户汇总阻塞项，请用户决定是“修复后继续”还是“接受当前状态并停止/调整流程”。
- **非阻塞反馈**：Reviewer 或 Tester 在 `APPROVED` 状态下给出的改进建议，也应先由 `feedback-curator` 记录；主流程可以继续，但在当前任务交付前统一向用户汇总并询问是否执行。
- **未经用户确认，不得因为 Agent 反馈自动触发新的实现改动。**
- **同类问题累计 2 次或以上**：除记录反馈外，`feedback-curator` 还应更新 `docs/memory/feedback/prevents-recurrence.md` 中的提名或统计，并由主 agent 在用户确认后推动规范升级。

## Feedback Curator 接入点

- **交接后触发**：Reviewer 或 Tester 的交接文档中包含有效 `Feedback Record` 时立即触发 `feedback-curator`
- **交付前触发**：当前任务准备交付前再次触发 `feedback-curator`，汇总尚未统一询问用户的非阻塞建议
- **职责边界**：`feedback-curator` 可以写 memory 文件，但不得直接修改业务代码、Skill、Agent 定义或 `AGENTS.md`

## 统一交接文档格式

```markdown
## 交接：[from] → [to]

### 任务上下文
- plan_path: ...
- task_id: ...
- step_scope: ...
- spec_refs: ...
- handoff_source: ...

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

### 建议
- ...

### Feedback Record
source: reviewer | tester | self-check | none
type: correction | improvement | issue | none
content: ...
suggestion: ...
prevents_recurrence: true | false

### 状态
APPROVED / REJECTED / BLOCKED
```

当没有新增反馈时，`Feedback Record` 填写 `source: none`。
角色可在“角色专项输出”中扩展各自字段，但必须保留上述公共骨架，确保主 agent 和 `feedback-curator` 能稳定消费。

**单独调用时的行为**：

当 agent 独立使用时（不通过 workflow），交接文档作为报告格式输出给用户。

## 调用方式

用户通过自然语言描述需求：
- "帮我用 developer 实现这个功能"
- "启动完整流程：dev → reviewer → tester"
- "开 3 个 reviewer 并行审查这段代码"

主 agent 读取对应 agent 定义，用自然语言传递上下文。

## 计划完成处理

实施计划完成后：
- 将计划从 `docs/exec-plans/active/` 移动到 `docs/exec-plans/completed/`
- 在 git 中提交状态变更

## 与现有流程的衔接

```
用户需求
    ↓
brainstorming（如需）
    ↓
writing-plans → 实施计划 → dev-workflow
    ↓
交付
```

## 扩展点

1. **领域 Skill**：后续可加入 react-dev、vue-dev 等，Developer agent 调用
2. **Team 模式完善**：多角色并行协作
3. **状态追踪**：交接文档持久化到 git
