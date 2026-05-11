# Product Spec — Role Skill System

> **Domain:** role-skill-system

## Goal

Define reusable role skills for implementation, review, testing, challenge, architecture, and feedback curation. These roles are regular skills under `skills/`, not host-specific agent definition files.

## Role Skills

| Skill | Responsibility |
|-------|----------------|
| `/architect` | Plan checks, docs impact, doc-sync gatekeeping |
| `/challenger` | Challenge plans, claims, API assumptions, and completion statements |
| `/developer` | TDD implementation and implementation handoff |
| `/reviewer` | Code quality and security review |
| `/tester` | Verification entrypoint detection and test execution |
| `/feedback-curator` | Feedback memory maintenance and recurrence nomination |

## Workflow Integration

`/dev-workflow` coordinates the role skills. It may execute a role inline or ask the host to delegate, but the contract remains skill-based:

- inputs are structured
- outputs are handoff records
- verification evidence is explicit
- feedback records are preserved

The repository must not rely on checked-in host runtime folders or legacy role-definition directories for these roles.

## Mode Guidance

| Mode | Use When | Execution |
|------|----------|-----------|
| Inline role skill | Small, clear task | Same host applies each role contract |
| Delegated role skill | Larger task or independent review needed | Host delegates with bounded payload and role skill contract |
| Parallel role review | Multiple independent risk surfaces | Host runs multiple bounded review/verification lanes |

## Handoff Requirements

Every role handoff should include:

- context and scope
- files or evidence reviewed
- commands run
- findings and risk levels
- feedback record when applicable
- final status: `APPROVED / REJECTED / BLOCKED`

## Installation Boundary

The installer copies `skills/` into Claude Code or Codex runtime folders. Runtime folders are generated artifacts and must not become repository facts.
