# Product Spec — Role Skill System

> **Domain:** role-skill-system

## 目标

定义可复用的 role skills，用于实现、审查、测试、挑战、架构判断和 feedback 整理。这些角色是 `skills/` 下的常规 skills，不是 host-specific agent definition files。

## Role Skills

| Skill | 职责 |
|-------|------|
| `/architect` | plan 检查、docs impact 判断、doc-sync gatekeeping |
| `/challenger` | 挑战 plan、claim、API 假设和完成声明 |
| `/developer` | PM 调度下的单 slice 实现、技术栈识别和 TDD 证据输出 |
| `/reviewer` | 代码质量和安全审查 |
| `/review-security` | 安全专项审查 pack，按 high-confidence data-flow 模式审查 auth、secrets、injection、tenant boundary 和 dependency risk |
| `/review-github-actions` | GitHub Actions 专项审查 pack，覆盖 workflow 安全和 AI agent action 风险 |
| `/review-frontend` | 前端专项审查 pack，覆盖 UI 状态、a11y、responsive、forms 和 interaction risk |
| `/review-performance` | 性能专项审查 pack，覆盖 hot path、queries、cache、bundle、large lists 和 expensive render/computation |
| `/tester` | 验证入口检测与测试执行 |
| `/feedback-curator` | feedback memory 维护与 recurrence 提名 |

## Workflow 集成

`/pm-orchestrator` 协调这些 role skills。它可以 inline 执行某个角色，也可以要求 host 委托执行，但契约始终基于 skill：

- 输入保持结构化
- 输出是结构化 role result 或 handoff records
- verification evidence 必须显式
- feedback records 必须保留

`/developer` 是 PM 调度下的 implementation role。它只执行明确分配的 task / slice，先读取内置实践和用户 repo 约定，必要时使用 `/tdd` 执行 RED/GREEN/REFACTOR，并输出轻量 `Developer Result`。它不写完整交接文档，不做独立 review，不决定 scope 扩张。

仓库不能依赖已提交的 host runtime folders 或旧 role-definition directories 来定义这些角色。

## Mode 指引

| Mode | 使用场景 | 执行方式 |
|------|----------|----------|
| Inline role skill | 小而清晰的任务 | 同一 host 应用各 role contract |
| Delegated role skill | 较大任务或需要独立审查 | Host 携带有界 payload 和 role skill contract 做委托 |
| Parallel role review | 存在多个独立风险面 | Host 运行多个有界 review / verification lanes |

## Handoff 要求

每个 role handoff 应包含：

- context 和 scope
- 已审查的文件或 evidence
- 已运行的 commands
- findings 和 risk levels
- 适用时包含 feedback record
- final status：`APPROVED / REJECTED / BLOCKED`

## 安装边界

安装器会把 `skills/` 复制到 Claude Code 或 Codex runtime folders。Runtime folders 是 generated artifacts，不能成为 repository facts。
