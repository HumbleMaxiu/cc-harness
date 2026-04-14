---
name: dev-workflow
description: 开发流程 agent 系统。包含 A/Dev/R/T 四种角色，支持 Skill/Subagent/Team 三种模式。
---

# Dev Workflow Agent System

开发流程 agent 系统，遵循 harness engineering 原则。

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
3. Subagent 完成后写交接文档
4. 主 agent 读取交接文档，决定下一步

### Team 模式

**适用场景**：需要多角度并行审查

**执行方式**：
1. 主 agent 创建 Agent Team
2. 多个 Reviewer 并行审查同一份代码
3. 结果汇总给主 agent

## 完整流程

```
用户需求
    ↓
Planner 写计划（writing-plans）
    ↓
用户选择模式
    ↓
┌──────────────────────────────────────┐
│  Skill 模式：主 agent 直接执行         │
│  Subagent 模式：主 agent 编排调用      │
│  Team 模式：创建 team，并行审查        │
└──────────────────────────────────────┘
    ↓
每个任务开始前 → Architect 检查计划文档
    ↓
Dev → Reviewer → [循环] → Tester → [循环]
    ↓
全部完成 → Architect 维护文档
    ↓
交付
```

## Workflow 层约束

- **每个角色完成后必须写交接文档**
- 单独调用时，交接文档作为报告格式输出给用户/主 agent
- 主 agent 读取交接文档后决定下一步操作

## 循环规则

- **Reviewer 审查不通过** → 打回 Developer 重新修改 → 重新审查
- **Tester 测试不通过** → 打回 Developer 重新修复 → 重新审查变更 → 重新测试
- **循环终止条件**：Reviewer 和 Tester 都 APPROVED

## 并行规则

- **Subagent 模式**：顺序调用，可临时起意开启多个 Reviewer 并行审查
- **Team 模式**：多个 Reviewer 默认并行审查

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

### 状态
APPROVED / REJECTED / BLOCKED
```

**单独调用时的行为**：

当 agent 不通过 workflow 调用时（独立使用场景），交接文档作为报告格式输出：
- `to` 填写"用户"或"主 agent"
- 内容聚焦于：该次调用完成的工作、发现的问题、建议
- 仍然必须写，维持 harness engineering 的"所有工作有记录"原则

## 调用方式

用户通过自然语言描述需求：
- "帮我用 developer 实现这个功能"
- "启动完整流程：dev → reviewer → tester"
- "开 3 个 reviewer 并行审查这段代码"

主 agent 读取对应 agent 定义，用自然语言传递上下文。

## 与现有流程的衔接

```
用户需求
    ↓
brainstorming（如需）→ writing-plans → dev-workflow
    ↓
交付
```

## 扩展点

1. **领域 Skill**：后续可加入 react-dev、vue-dev 等，Developer agent 调用
2. **Team 模式完善**：多角色并行协作
3. **状态追踪**：交接文档持久化到 git
