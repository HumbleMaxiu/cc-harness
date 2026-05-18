# TDD Source Attribution

## Primary Imported Source

- Source project: `obra/superpowers`
- Source skill/path: `skills/test-driven-development/SKILL.md`
- Source URL: `https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md`
- License: MIT License
- Imported commit: `f2cbfbefebbfef77321e4c9abc9e949826bea9d7`
- Import date: `2026-05-15`
- Local skill name: `tdd`
- Local changes: Converted Superpowers TDD discipline into a cc-harness installable skill; added PM/Developer control split, TDD exception format, `TDD Result` output, feedback boundary and install portability.
- Compatibility notes: Runtime files needed by `/tdd` live inside `skills/tdd/`; external projects are attribution and design sources, not runtime dependencies.

## Supplemental Source

- Source project: `addyosmani/agent-skills`
- Source skill/path: `skills/test-driven-development/SKILL.md`; `skills/incremental-implementation/SKILL.md`; `skills/context-engineering/SKILL.md`
- Source URL: `https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md`; `https://github.com/addyosmani/agent-skills/blob/main/skills/incremental-implementation/SKILL.md`; `https://github.com/addyosmani/agent-skills/blob/main/skills/context-engineering/SKILL.md`
- License: MIT License
- Imported commit: `5b4c6dade5e6b5a48067d08861a11732d8e3a2bf`
- Import date: `2026-05-15`
- Local skill name: `tdd`
- Local changes: Borrowed the Prove-It Pattern, small/medium/large test framing, DAMP-over-DRY test guidance and incremental slice discipline as local review lenses.
- Compatibility notes: Supplemental source is not a runtime dependency.

## Reviewed But Not Imported

- `github/spec-kit`: useful task structure and tests-before-implementation language; not copied into `/tdd`.
- `buildermethods/agent-os`: useful standards injection model; used in `/developer` stack-practice loading, not `/tdd`.
- `bmad-code-org/BMAD-METHOD`: useful ready-story and acceptance-criteria discipline; not copied because runtime is BMAD-specific.
- `modu-ai/moai-adk`: useful boundary verification idea; not copied into `/tdd`.
