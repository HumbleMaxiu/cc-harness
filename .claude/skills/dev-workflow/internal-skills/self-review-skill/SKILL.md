---
name: self-review-skill
description: Internal sub skill for dev-workflow Skill mode. Use after Execute to perform structured self-review, produce reusable feedback_record output, and decide whether the task can remain in Skill mode or must escalate to Subagent. Not a user-facing top-level entry by default.
---

# Self Review Skill

> Internal sub skill for `dev-workflow` Skill mode.

## Purpose

Run the `Self Review` stage after execution completes.

This sub skill reduces the risk that Skill mode silently treats "implemented" as "done" without a structured review pass.

## Inputs

Load and inspect:

- changed files
- commands run
- current task goal
- relevant specs / design docs
- `docs/memory/index.md`
- `docs/memory/feedback/prevents-recurrence.md`

## Required checks

Evaluate at least:

- does the change satisfy the stated task goal?
- is there an obvious missing test, doc sync, or edge case?
- is there a clear correctness / safety / maintainability issue?
- does the issue require an independent reviewer perspective?
- is the task complexity now beyond clean single-agent tracking?

## Output contract

Return output that can be copied directly into the parent `Skill Workflow Record`:

```markdown
### Self Review
- checklist:
- issues_found:
- feedback_record:
- escalate_to_subagent:
```

If there is feedback, the embedded `feedback_record` should support at least:

- `source: self-check`
- `pattern`
- `rule`
- `action_type`
- `risk_level`
- `scope`
- `suggestion`

## Escalation rules

Recommend escalation to `Subagent` when any of the following is true:

- an issue needs an independent reviewer to validate
- this is already the second review/fix loop
- the task now spans too much state for clean Skill mode tracking
- the issue implies higher-risk or broader-scope changes than originally expected

## Boundaries

- Do not replace full verification
- Do not create a second report format outside `Skill Workflow Record`
- Do not hide serious issues in vague wording
- Do not continue silently when escalation is clearly warranted

## Usage notes

- This sub skill is designed for internal use from `dev-workflow`
- Prefer concrete checklist items over high-level reassurance
- If no issues are found, still return a complete `Self Review` block
