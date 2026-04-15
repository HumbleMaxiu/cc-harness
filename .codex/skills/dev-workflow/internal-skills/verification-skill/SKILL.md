---
name: verification-skill
description: Internal sub skill for dev-workflow Skill mode. Use during the Verify stage to detect project-native validation entrypoints, select the best checks for the current change, record assumptions and uncovered risks, and decide whether verification complexity requires escalation. Not a user-facing top-level entry by default.
---

# Verification Skill

> Internal sub skill for `dev-workflow` Skill mode.

## Purpose

Run the `Verify` stage of Skill mode using the same core ideas as the Tester contract, but within a single-agent workflow.

## Inputs

Load and inspect:

- repository stack signals
- changed files / scope of change
- user task goal
- commands already run
- available project-native validation commands

## Required checks

Evaluate at least:

- what validation entrypoints exist in this repo?
- which check is most native and relevant to this change?
- what was actually executed?
- what assumptions were required?
- what risks remain uncovered?
- does verification now require an independent tester or multiple viewpoints?

## Output contract

Return output that can be copied directly into the parent `Skill Workflow Record`:

```markdown
### Verification
- detected_entrypoints:
- executed_checks:
- assumptions:
- uncovered_risks:
- feedback_record:
```

If verification finds a problem, the embedded `feedback_record` should support at least:

- `source: self-check`
- `pattern`
- `rule`
- `action_type`
- `risk_level`
- `scope`
- `suggestion`

## Escalation rules

Recommend escalation to `Subagent` or `Team` when any of the following is true:

- verification needs an independent tester gate
- different risk surfaces need separate validation viewpoints
- repeated verification failures are forming a loop
- the available validation surface is complex enough that single-agent tracking is no longer clean

## Boundaries

- Do not assume a fixed test script when the repo provides no evidence
- Do not skip verification just because there is no single unified command
- Do not conceal uncovered risks
- Do not create a report format outside `Skill Workflow Record`

## Usage notes

- This sub skill is designed for internal use from `dev-workflow`
- Prefer project-native commands over generic guesses
- If no reliable command can be chosen, record the uncertainty explicitly
