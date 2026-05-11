---
name: dev-workflow
description: 角色 Skill 驱动的开发闭环。用于计划后的实现、审查、验证、反馈整理和文档同步。
---

# Dev Workflow

`dev-workflow` 接在 `/writing-plans` 或明确规格之后。它使用角色 Skill 组织执行闭环，不再调用 host-specific role definition files。

## Inputs

- `plan_path`
- `task_scope`
- `spec_refs`
- `memory_refs`
- `operation_risk`

开始前先读取：

- `docs/memory/index.md`
- `docs/memory/feedback/prevents-recurrence.md`
- 当前 active exec plan 或用户给出的明确规格

## Role Skills

| Role Skill | When Used | Responsibility |
|------------|-----------|----------------|
| `/architect` | 执行前和收尾前 | 计划检查、docs impact 判断、文档同步 gatekeeping |
| `/challenger` | 关键 claim、API 假设、完成声明需要挑战时 | 对抗式验证 |
| `/developer` | 实现阶段 | TDD 实现和实现 handoff |
| `/reviewer` | 实现后 | 代码质量和安全审查 |
| `/tester` | 审查后 | 探测验证入口并执行测试矩阵 |
| `/feedback-curator` | 有 `Feedback Record` 或交付前 | 维护 feedback memory 和 recurrence |

## Flow

```text
Input Ready
  -> Architect Check
  -> Developer Execute
  -> Reviewer Review
  -> Feedback Curator if needed
  -> Tester Verify
  -> Feedback Curator if needed
  -> Doc Sync
  -> Final Summary
```

For small tasks, the same host may execute the role contracts inline. For complex tasks, the host may delegate work, but each delegated lane must still preserve the role skill's input, output, and validation contract.

## Run Trace

Every run must keep a recoverable trace:

```markdown
### Run Trace
- trace_id:
- plan_path:
- task_scope:
- current_phase:
- last_handoff:
- files_touched:
- commands_run:
- last_result:
- last_failure_reason:
- resume_entry:
```

## Risk Model

`dev-workflow` uses two separate risk fields:

- `risk_level`: severity of a finding, `low / medium / high`
- `operation_risk`: risk of the action, `read-only / reversible-write / irreversible-write / external-side-effect`

Rules:

- `read-only`: continue and report important findings
- `reversible-write`: may proceed if scoped and validated
- `irreversible-write`: require explicit operation gate before execution
- `external-side-effect`: require explicit operation gate before execution

Operation gate format:

```markdown
### Operation Gate
- objective:
- requested_action:
- target_paths_or_systems:
- operation_risk:
- expected_side_effects:
- reversibility:
- rollback_plan:
- confirmation_status: pending
```

## Feedback Handling

- Reviewer, Tester, and self-check findings that affect future behavior should include a `Feedback Record`
- `/feedback-curator` records reusable patterns in `docs/memory/feedback/agent-feedback.md`
- repeated patterns are nominated in `docs/memory/feedback/prevents-recurrence.md`
- one-off command output and temporary failures stay in handoff evidence, not long-term memory

## Handoff Contract

Role skills should return structured handoff text:

```markdown
## Handoff: <role> -> <next>

### Context
- plan_path:
- task_scope:
- spec_refs:
- memory_refs:

### Work Performed
- files_touched:
- commands_run:
- evidence:

### Findings
- blocking:
- risk_level:
- operation_risk:
- recommendation:

### Feedback Record
source:
type:
pattern:
rule:
action_type:
risk_level:
operation_risk:
scope:
content:
suggestion:
prevents_recurrence:

### Status
APPROVED / REJECTED / BLOCKED
```

## Verification

Before final summary:

1. Run the most relevant repo-native checks.
2. Confirm docs impact and run `/doc-sync` when needed.
3. Confirm no unresolved `Operation Gate` remains.
4. Summarize tests run, uncovered risks, and follow-ups.

Do not claim completion without evidence.
