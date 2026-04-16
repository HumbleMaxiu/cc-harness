---
name: plan-check-skill
description: Internal sub skill for dev-workflow Skill mode. Use to perform the Plan Check stage before Execute: verify input completeness, identify scope/risk gaps, and decide whether the task can stay in Skill mode or must escalate to Subagent/Team. Not a user-facing top-level entry by default.
---

# Plan Check Skill

> Internal sub skill for `dev-workflow` Skill mode.

## Purpose

Run the `Plan Check` stage of Skill mode before implementation begins.

This sub skill answers two questions:

1. Is the current input complete enough to proceed?
2. Is the current task still a fit for `Skill` mode?

## Inputs

Load and inspect:

- user request
- `plan_path` when available
- relevant spec / design doc refs
- `docs/memory/index.md`
- `docs/memory/feedback/prevents-recurrence.md`

## Required checks

Evaluate at least:

- is the task scope clear?
- does the plan have missing inputs or open assumptions?
- does the task look likely to require independent reviewer / tester gates?
- is there obvious high-risk or irreversible work?
- is the task likely to loop through multiple review/fix rounds?
- if substantive edits are expected, is there an acceptable `plan_path` or equivalent plan source?
- what are the most likely plan drift watchpoints once execution begins?

## Output contract

Return output that can be copied directly into the parent `Skill Workflow Record`:

```markdown
### Mode Decision
- fit_for_skill_mode: true | false
- escalation_reason:
- plan_gaps:
- scope_risks:
- required_inputs:
- plan_drift_watchpoints:
```

## Escalation rules

Recommend escalation to `Subagent` when any of the following is true:

- substantive edits are requested but no acceptable `plan_path` or equivalent plan source exists
- scope crosses multiple modules and boundaries are unclear
- independent reviewer / tester gates are obviously needed
- multiple feedback loops are likely
- high-risk irreversible actions are involved

Recommend escalation to `Team` only if parallel multi-angle review is already clearly required.

## Boundaries

- Do not implement code
- Do not run as a replacement for `writing-plans`
- Do not create a parallel report format
- Do not silently continue when missing inputs materially affect execution

## Usage notes

- This sub skill is designed for internal use from `dev-workflow`
- Keep output concise and decision-oriented
- Prefer explicit missing inputs over vague caution
- If substantive edits would proceed without a plan, return `fit_for_skill_mode: false` and treat it as `missing-plan`
