# AGENTS.md Standard Template

Based on the Harness Engineering framework and AGENTS.md industry best practices.

**Core Principles**:
- AGENTS.md is a **directory index**, not an encyclopedia. Only encode what the model cannot infer on its own.
- Content can be in English or mixed English/Chinese. File paths, code snippets, and technical terms stay in their original language (usually English).
- Documentation Map descriptions use English primarily (consistent with the AGENTS.md industry standard).

---

## Standard Structure

```markdown
# Project Name

> One-line project description

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## Project Overview

[2-3 sentences: what the project is, what problem it solves]

## Tech Stack

- **Language/Framework**: [core framework]
- **Build Tool**: [build tool]
- **Key Dependencies**: [3-5 core dependencies]

## Directory Structure

```
project/
├── src/                    # Source code
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page/route components
│   └── utils/             # Utility functions
├── tests/                 # Tests
├── docs/                  # Documentation (see below)
└── scripts/               # Build scripts
```

## Key Conventions

> ⚠️ **Important**: The following rules are hard constraints that the model cannot infer on its own.
> 💡 **Convention sourcing**: Conventions must come from user input whenever possible. If the user has not specified conventions, infer from existing code patterns — do NOT fabricate rules for patterns that don't exist in the codebase.

1. [Convention 1 — be specific, avoid vagueness]
2. [Convention 2]
3. [Convention 3]

## Code Style

- [Style rule 1]
- [Style rule 2]

## Documentation Map

| Topic | File |
|-------|------|
| Architecture | `docs/architecture.md` |
| API Reference | `docs/api.md` |
| Code Conventions | `docs/conventions.md` |
| Testing Strategy | `docs/testing.md` |

> ⚠️ **Document map rules**: Only include user-facing docs (`docs/*.md`, `README.md`). Do NOT include internal development resources like `.claude/`, `skill-creator/references/`, or plugin-internal paths.

## Common Tasks

| Task | Command |
|------|---------|
| Run tests | `npm test` |
| Build for production | `npm run build` |
| Lint | `npm run lint` |

## Language Constraint (Optional)

To constrain agent reply language to Chinese, add this section. This is optional and only needed if the project explicitly requires it:

```markdown
## Language Constraint

**You must respond in Chinese.** All replies, comments, and commit messages use Chinese.
```

> ⚠️ This clause only constrains the agent's communication language. It does NOT require the AGENTS.md content itself to be entirely in Chinese. File paths and code snippets stay in English.

---

## Subdirectory AGENTS.md Template

Subdirectory AGENTS.md files **do NOT need** the language constraint clause (inherited from root). Focus on module-specific content:

```markdown
# [Module Name]

> Module's responsibility in the project

## Relationship with Root AGENTS.md

This module is part of [project name]. General conventions from the root `AGENTS.md` still apply.

## Module-Specific Conventions

[Rules unique to this module, 3-8 items]

## Key Files

| File | Purpose |
|------|---------|
| `file1.ts` | [description] |
| `file2.ts` | [description] |

## Dependencies

- Upstream: `../module-x/AGENTS.md`
- Downstream: `../module-y/AGENTS.md` (if applicable)
```

---

## Quality Checklist

After generating AGENTS.md, self-check:

- [ ] Line count is 50–200
- [ ] Contains "Quick Start" (1-3 commands)
- [ ] Contains "Key Conventions" (3-8 specific rules, sourced from user or existing code — not fabricated)
- [ ] Contains "Documentation Map" (pointing to `docs/` files, NOT internal `.claude/` paths)
- [ ] No large code blocks or documentation pasted verbatim
- [ ] No stale information (include `[Last verified: YYYY-MM-DD]`)
- [ ] Language constraint section added only if explicitly requested by user
