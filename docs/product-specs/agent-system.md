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
| **Skill 模式** | 单一任务、边界清楚、无需独立 reviewer | 主 agent 按固定状态机执行单 agent workflow，并产出结构化 `Skill Workflow Record` |
| **Subagent 模式** | 需要循环审查、有状态追踪 | 主 agent 编排调用 subagent |
| **Team 模式** | 多角度并行审查 | 多个 Reviewer 并行审查 |

Skill 模式的默认状态机为：

`Input Ready -> Plan Check -> Execute -> Self Review -> Verify -> Doc Sync -> Final Summary`

当任务出现循环审查、强状态追踪、高风险工具操作或需要独立 reviewer / tester 视角时，应从 Skill 模式升级到 Subagent 或 Team 模式。

### 统一风险语言

Agent System 使用两套互补字段：

- `risk_level`：反馈或问题本身的严重性，使用 `low / medium / high`
- `operation_risk`：动作或工具调用的执行风险，使用 `read-only / reversible-write / irreversible-write / external-side-effect`

其中：

- `read-only`：默认允许，主 agent 可继续推进
- `reversible-write`：在自动执行白名单内可继续推进，并在最终交付统一汇报
- `irreversible-write`：不得自动执行，执行前需要用户明确确认
- `external-side-effect`：不得自动执行，执行前需要用户明确确认

这套风险语言适用于 Skill / Subagent / Team 三种模式，避免各角色各自使用不同口径描述“能不能自动做”。

### 反馈决策

- `REJECTED` 属于阻塞型反馈：主 agent 先记录，再自动回到实现修复并继续主流程
- `APPROVED` 下的建议属于非阻塞反馈：主 agent 先记录，允许主流程继续，并在最终交付前统一向用户汇总
- 反馈记录和汇总由 `feedback-curator` 承担；用户只在最终交付时统一确认产物、风险和待执行建议
- Tester 先探测项目当前可用的 test / lint / typecheck / build 入口；无法可靠判断时向用户确认，而不是假定固定脚本

### 完整流程

```
用户需求
    ↓
brainstorming（如需）→ writing-plans → 选择模式
    ↓
Skill：单 agent workflow
或
Subagent：Dev → Reviewer → Tester
或
Team：并行 Reviewer / Tester 视角
    ↓
Feedback Curator（如产生 `Feedback Record`）
    ↓
文档维护 / 最终汇总
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
- `operation_risk`
- `confirmation_needed`

在此基础上：

- Architect 输出计划校验清单、范围确认和文档影响矩阵
- Developer 输出 completed / remaining steps 与结构化自检结果
- Reviewer 输出 severity / confidence / violates / recurrence candidate
- Tester 输出验证入口探测、测试矩阵、环境假设和未覆盖风险

Skill 模式下不要求多角色 handoff，但必须至少输出一份包含 `Context`、`Mode Decision`、`Execution`、`Self Review`、`Verification`、`Doc Sync`、`Final Summary` 的 `Skill Workflow Record`。

如果计划动作属于 `irreversible-write` 或 `external-side-effect`，交接文档或 `Skill Workflow Record` 中还必须包含一段 `Operation Gate`，明确目标、影响范围、可回滚性与确认状态。

## 相关文档

- Dev Workflow SKILL：`skills/dev-workflow/SKILL.md`
- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
