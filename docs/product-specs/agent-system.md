# Product Spec — Agent System

> **Domain：** agent-system

## 目标

定义一套标准化的 Agent 角色体系，支持独立调用和流程化编排，实现高效的 AI 协作。

## 用户可见行为

### Agent 角色

| 角色 | 文件 | 职责 | 触发时机 |
|------|------|------|---------|
| Architect | `.claude/agents/architect.md` | 计划检查、文档维护 | 任务开始前 / 完成后 |
| Developer | `.claude/agents/developer.md` | TDD 实现 | 收到 Architect 交接后 |
| Reviewer | `.claude/agents/reviewer.md` | 代码质量和安全审查 | 收到 Developer 交接后 |
| Tester | `.claude/agents/tester.md` | 测试验证 | 收到 Reviewer 交接后 |

### 三种开发模式

| 模式 | 适用场景 | 执行方式 |
|------|---------|---------|
| **Skill 模式** | 单一任务、步骤明确 | 主 agent 直接执行各阶段 |
| **Subagent 模式** | 需要循环审查、有状态追踪 | 主 agent 编排调用 subagent |
| **Team 模式** | 多角度并行审查 | 多个 Reviewer 并行审查 |

### 完整流程

```
用户需求
    ↓
brainstorming（如需）→ writing-plans
    ↓
Architect 检查计划文档
    ↓
Dev → Reviewer → [循环] → Tester → [循环]
    ↓
Architect 维护文档
    ↓
交付
```

## 交接文档

每个角色完成后必须输出交接文档，格式统一。循环打回时状态为 REJECTED，附问题列表。

## 相关文档

- Dev Workflow SKILL：`skills/dev-workflow/SKILL.md`
- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
