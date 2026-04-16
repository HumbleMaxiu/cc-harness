# feedback-curator-memory-sync behavior eval

## Task

The `feedback-curator` agent receives a valid `Feedback Record` from another role.

It must:

1. Write a new `af-YYYYMMDD-NNN` record into `docs/memory/feedback/agent-feedback.md`.
2. Preserve execution/final-report state.
3. Emit a curator handoff with an auto-processing summary.
