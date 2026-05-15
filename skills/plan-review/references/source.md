# Plan Review Source Attribution

## Primary Imported Source

- Source project: `dsifry/metaswarm`
- Source skill/path: `skills/plan-review-gate/SKILL.md`; `rubrics/plan-review-rubric-adversarial.md`
- Source URL: `https://github.com/dsifry/metaswarm/blob/main/skills/plan-review-gate/SKILL.md`; `https://github.com/dsifry/metaswarm/blob/main/rubrics/plan-review-rubric-adversarial.md`
- License: MIT License
- Imported commit: `c86fd6c422a8ddb3d5a0524d2acb784359c25b05`
- Import date: `2026-05-14`
- Local skill name: `plan-review`
- Local changes: Replaced metaswarm's multi-reviewer orchestration with one cc-harness skill controlled by `/pm-orchestrator`; converted results to `Review Handoff`; added docs-first checks, TDD discipline, install portability, feedback boundary and PM failure backflow.
- Compatibility notes: Runtime files needed by `/plan-review` live inside `skills/plan-review/`; external projects are attribution and design sources, not runtime dependencies.

## Reviewed But Not Imported

- `plan-fresh-eyes-review` gist: useful fresh-eyes concept, but license is unclear; do not copy text.
- `arunt14/spec-kit-critique`: useful product / engineering critique lens; do not bind `/plan-review` to `/speckit.plan`.
- `luno/spec-kit-plan-review-gate`: useful future PR / MR gate model; do not add spec-kit merge workflow in this change.
- `garrytan/gstack` plan review skills: useful role split idea, but too tied to gstack runtime for this repository.

If a future change copies more text or behavior from any reviewed-but-not-imported source, verify its license first and update this file.
