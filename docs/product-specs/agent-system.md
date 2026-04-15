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
| Tester | `.claude/agents/tester.md` | 探测验证入口并执行测试验证 | 收到 Reviewer 交接后 |
| Feedback Curator | `.claude/agents/feedback-curator.md` | 整理反馈、维护 memory、输出决策摘要 | 收到带 `Feedback Record` 的交接后 / 任务交付前 |

### 三种开发模式

| 模式 | 适用场景 | 执行方式 |
|------|---------|---------|
| **Skill 模式** | 单一任务、步骤明确 | 主 agent 直接执行各阶段 |
| **Subagent 模式** | 需要循环审查、有状态追踪 | 主 agent 编排调用 subagent |
| **Team 模式** | 多角度并行审查 | 多个 Reviewer 并行审查 |

### 反馈决策

- `REJECTED` 属于阻塞型反馈：主 agent 先记录，再立即询问用户是否修复后继续
- `APPROVED` 下的建议属于非阻塞反馈：主 agent 先记录，允许主流程继续，并在任务交付前统一询问用户
- 反馈记录和汇总由 `feedback-curator` 承担；是否执行仍由主 agent 向用户确认
- Tester 先探测项目当前可用的 test / lint / typecheck / build 入口；无法可靠判断时向用户确认，而不是假定固定脚本

### 完整流程

```
用户需求
    ↓
brainstorming（如需）→ writing-plans
    ↓
Architect 检查计划文档
    ↓
Dev → Reviewer
    ↓
Feedback Curator 记录审查反馈并输出决策摘要
    ↓
主 agent 在阻塞项时立即询问用户；通过后进入 Tester
    ↓
Tester
    ↓
Feedback Curator 记录测试反馈并输出决策摘要
    ↓
主 agent 在阻塞项时立即询问用户，在非阻塞项上于交付前统一询问
    ↓
Architect 维护文档
    ↓
交付
```

## 交接文档

每个角色完成后必须输出交接文档。交接文档采用“公共骨架 + 角色专项字段”的模式，至少包含：

- `plan_path`
- `task_id`
- `step_scope`
- `files_touched`
- `commands_run`
- `status`
- `blocking`
- `Feedback Record`

在此基础上：

- Architect 输出计划校验清单、范围确认和文档影响矩阵
- Developer 输出 completed / remaining steps 与结构化自检结果
- Reviewer 输出 severity / confidence / violates / recurrence candidate
- Tester 输出验证入口探测、测试矩阵、环境假设和未覆盖风险

## 相关文档

- Dev Workflow SKILL：`skills/dev-workflow/SKILL.md`
- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
