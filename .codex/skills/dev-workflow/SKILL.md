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
5. 如交接文档包含 `Feedback Record`，主 agent 负责同步到 `docs/memory/feedback/agent-feedback.md`

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
    ↓ [不通过]
    ↑____________↓
    ↓
[通过] → Tester 测试
    ↓ [不通过]
    ↑____________↓
    ↓
[通过] → Architect 维护文档
    ↓
交付
```

### 循环定义

| 循环 | 条件 | 动作 |
|------|------|------|
| Dev → Reviewer | REJECTED | 打回 Dev 重新修改 |
| Dev → Reviewer | APPROVED | 进入 Tester |
| Tester | REJECTED | 打回 Dev 修复 → Reviewer 重新审查 |
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

## 统一交接文档格式

```markdown
## 交接：[from] → [to]

### 任务
[任务描述]

### 完成内容
- 文件变更列表
- 实现摘要

### 结果
[审查结果 / 测试结果]

### 建议
[下一步建议]

### 待解决问题
- [ ] ...

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
