# Product Spec — Agent System

> **Domain：** agent-system

## 目标

定义一套标准化的 Agent 角色体系，支持独立调用和流程化编排，实现高效的 AI 协作。

## 用户可见行为

### Agent 角色

| 角色 | 文件 | 职责 | 触发时机 |
|------|------|------|---------|
| Architect | `.claude/agents/architect.md` | 计划检查、docs impact 判断、触发文档同步 | 任务开始前 / 完成后 |
| Challenger | `.claude/agents/challenger.md` | 对计划、claim、API 假设和完成声明做对抗式验证 | 计划形成后 / 完成声明复杂时 |
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

其中 `Doc Sync` 阶段应复用顶级 `/doc-sync` Skill 的契约，而不是由主 agent 临场决定文档维护方式。

其中 `Plan Drift` 不作为独立顶层阶段存在，而是作为跨 `Execute` 和 `Final Summary` 的执行期守卫：

- `Plan Check` 先识别 `plan_drift_watchpoints`
- `Execute` 结束后检查本轮是否发生计划偏移
- `Final Summary` 前再次确认偏移是否已解决、升级或记录

第一阶段只做 workflow 级检测，不依赖 hook。优先关注：

- 是否缺少可接受的 `plan_path`
- 是否触碰明显超出 `task_scope` 的文件
- 是否出现比原计划更高的 `operation_risk`
- 是否产生了未记录的 follow-up

当任务出现循环审查、强状态追踪、高风险工具操作或需要独立 reviewer / tester 视角时，应从 Skill 模式升级到 Subagent 或 Team 模式。

当计划、claim 或完成声明依赖未经验证的外部事实、API 假设或复杂推断时，应触发 `challenger` 做对抗式验证。

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

跨模式共享能力：

- `/doc-sync`：用于 Skill 模式的 `Doc Sync` 阶段，以及 Subagent 模式下 `Architect` 的文档同步执行
- `/plan-persist`：用于小任务、探索任务和恢复场景中的轻量 planning 持续化；围绕 active exec plan 与 `Run Trace` 提供 hook 辅助连续性

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
- 如触发文档同步，Architect 还应附带 `Doc Sync Result`
- Developer 输出 completed / remaining steps 与结构化自检结果
- Reviewer 输出 severity / confidence / violates / recurrence candidate
- Tester 输出验证入口探测、测试矩阵、环境假设和未覆盖风险

Skill 模式下不要求多角色 handoff，但必须至少输出一份包含 `Context`、`Mode Decision`、`Execution`、`Plan Drift`、`Self Review`、`Verification`、`Doc Sync`、`Final Summary` 的 `Skill Workflow Record`。

`Mode Decision` 应至少包含：

- `fit_for_skill_mode`
- `escalation_reason`
- `plan_drift_watchpoints`

`Plan Drift` 应至少包含：

- `drift_detected`
- `drift_type`
- `evidence`
- `impact_on_plan`
- `required_action`
- `resolved_by`

如果计划动作属于 `irreversible-write` 或 `external-side-effect`，交接文档或 `Skill Workflow Record` 中还必须包含一段 `Operation Gate`，明确目标、影响范围、可回滚性与确认状态。

第一阶段的处理规则：

- `missing-plan`：阻塞，不应继续执行实质性改动
- `risk-expanded` 且升级到 `irreversible-write` / `external-side-effect`：阻塞，先进入 `Operation Gate`
- 其他偏移：允许继续，但必须记录并在最终总结说明

## 相关文档

- Dev Workflow SKILL：`skills/dev-workflow/SKILL.md`
- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
