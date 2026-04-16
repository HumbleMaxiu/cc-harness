# architect-plan-gate behavior eval

## Task

The `architect` agent is asked to review a task before implementation begins.

It should:

1. Confirm whether execution is ready.
2. Emit the plan validation checklist.
3. Produce a docs impact matrix.
4. End with an explicit `APPROVED` or `BLOCKED` status.
