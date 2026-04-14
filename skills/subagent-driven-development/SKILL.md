---
name: subagent-driven-development
description: 通过 Claude Code subagent 执行实现计划，支持 A/E/T/C 四种角色协同工作
---

# Subagent-Driven Development

通过 Claude Code subagent 执行实现计划，支持架构师(A)、工程师(E)、测试工程师(T)、挑战者(C)四种角色协同工作。

**核心原则：** 每个任务经过 A→C 计划审查 → E→T 实现测试 → C 实现审查 的完整流程

## 角色定义

角色以 Claude Code subagent 形式定义，位于 `.claude/agents/` 目录：

| 角色 | Subagent | 职责 |
|------|----------|------|
| 架构师 (A) | `@architect` | 规划、设计、文档维护 |
| 工程师 (E) | `@engineer` | TDD 实现 |
| 测试工程师 (T) | `@tester` | 独立测试，补充边界情况 |
| 挑战者 (C) | `@challenger` | 对抗性审查，质量门禁 |

## 流程

### Plan 阶段

```
A (@architect) 写 Plan → C (@challenger) 审查 → [A-C 循环] → C 确认通过 → 进入实现阶段
```

### 实现阶段

```
E (@engineer) 实现 → T (@tester) 测试 → [E-T 小循环] → 测试通过 → C (@challenger) 审查 → [E/T-C 小循环] → 审查通过 → 下一任务
```

### 状态机

每个 agent 报告以下状态之一：
- **DONE**：完成
- **DONE_WITH_CONCERNS**：完成但有疑虑
- **BLOCKED**：被阻塞，无法继续
- **NEEDS_CONTEXT**：需要更多信息

## Subagent 调用方式

使用 `@<subagent-name>` 或 Agent tool 派发：

```
@architect 审查 docs/exec-plans/active/2026-04-14-feature.md
@engineer 实现任务 3 - 用户认证模块
@tester 补充边界情况测试
@challenger 审查实现是否符合计划
```

## 工作流配置

流程定义在 `.claude/agents/config/workflow.yaml`，包含：
- 角色定义
- 流程阶段
- 状态转换
- 交接文档模板位置

## 交接文档

每次角色转换时使用 `skills/subagent-driven-development/handoffs/` 目录下的模板生成交接文档。

交接文档模板：
- `architect-to-challenger.md` - A→C
- `challenger-to-engineer.md` - C→E
- `engineer-to-tester.md` - E→T
- `tester-to-challenger.md` - T→C
- `challenger-to-controller.md` - C→Controller

## 文件结构

```
.claude/
  agents/
    architect.md      # 架构师 subagent
    engineer.md       # 工程师 subagent
    tester.md         # 测试工程师 subagent
    challenger.md     # 挑战者 subagent
    config/
      workflow.yaml   # 工作流配置

skills/
  subagent-driven-development/
    SKILL.md         # 本文档
    handoffs/        # 交接文档模板
```

## 如何使用

1. **启动流程**：读取 Plan 文件，分解任务
2. **派发 Architect**：使用 `@architect` 生成计划文档
3. **派发 Challenger**：使用 `@challenger` 审查计划
4. **派发 Engineer**：使用 `@engineer` 实现任务
5. **派发 Tester**：使用 `@tester` 补充测试
6. **派发 Challenger**：使用 `@challenger` 审查实现
7. **循环直到所有任务完成**
