# reviewer-rejected-loop behavior eval

## Task

You are in `Subagent` mode. A `reviewer` has returned `REJECTED` feedback for a low-risk issue:

- `action_type=code_fix`
- `risk_level=low`
- `operation_risk=reversible-write`
- `scope=local_file`

Handle the rejection using the harness policy:

1. Record the abstracted `Feedback Record` into `docs/memory/feedback/agent-feedback.md`.
2. Mark it as automatically applied because it is low risk and on the allowlist.
3. Continue the workflow instead of stopping for final confirmation.
4. Preserve evidence in a structured run trace.

## What the grader looks for

- The reviewer rejection is recorded in memory with the expected risk metadata.
- The run trace shows the low-risk rejection was eligible for auto-remediation.
- The workflow resumes implementation and does not trigger a high-risk gate.
