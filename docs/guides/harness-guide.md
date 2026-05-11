# Harness Guide

Use this guide to choose the right `cc-harness` entry.

## Install Into A Project

From the `cc-harness` checkout:

```bash
./install.sh --target both --dest /path/to/project
```

Use `--target claude-code` or `--target codex` when only one host is needed. See [AI-Facing Installation Guide](../install-ai.md) for instructions that can be given directly to another AI coding agent.

## Entry Selection

| Scenario | Start Here |
|----------|------------|
| New project needs harness docs | `/harness-setup` |
| Unsure which workflow to use | `/harness-help` or `/harness-guide` |
| New feature or design-heavy work | `/brainstorming` then `/writing-plans` |
| Clear implementation task | `/dev-workflow` |
| Small task with continuity needs | `/plan-persist` |
| Docs affected by code or workflow changes | `/doc-sync` |
| Delivery is near | `/harness-quality-gate` |
| User has durable process feedback | `/feedback` |
| Need to inspect feedback history | `/feedback-query` |

## Development Flow

1. Read relevant specs and memory.
2. Clarify or freeze requirements.
3. Plan when the task has multiple steps.
4. Execute through `/dev-workflow`.
5. Use role skills for architecture, implementation, review, testing, challenge, and feedback curation.
6. Sync docs.
7. Run quality gate.

## Role Skill Usage

| Role Skill | Use |
|------------|-----|
| `/architect` | Check plan and docs impact |
| `/developer` | Implement with TDD evidence |
| `/reviewer` | Review changed code and risks |
| `/tester` | Detect and run verification commands |
| `/challenger` | Challenge claims and assumptions |
| `/feedback-curator` | Convert reusable findings into feedback memory |

## Recovery Order

1. `AGENTS.md`
2. current active exec plan
3. `docs/memory/index.md`
4. latest Run Trace or handoff
