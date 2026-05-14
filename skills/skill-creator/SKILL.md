---
name: skill-creator
description: Create, edit, improve, or audit AgentSkills. Use when creating a new skill from scratch or when asked to improve, review, audit, tidy up, or clean up an existing skill or SKILL.md file. Also use when editing or restructuring a skill directory (moving files to references/ or scripts/, removing stale content, validating against the AgentSkills spec). Triggers on phrases like "create a skill", "author a skill", "tidy up a skill", "improve this skill", "review the skill", "clean up the skill", "audit the skill".
---

# Skill Creator

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular, self-contained packages that extend Codex's capabilities by providing
specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific
domains or tasks—they transform Codex from a general-purpose agent into a specialized agent
equipped with procedural knowledge that no model can fully possess.

When the current repository already records repeated friction in `docs/memory/feedback/` or
`docs/memory/feedback/prevents-recurrence.md`, those records should be treated as high-signal
inputs for deciding whether a new skill should exist.

### What Skills Provide

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and repetitive tasks

## Core Principles

### Concise is Key

The context window is a public good. Skills share the context window with everything else Codex needs: system prompt, conversation history, other Skills' metadata, and the actual user request.

**Default assumption: Codex is already very smart.** Only add context Codex doesn't already have. Challenge each piece of information: "Does Codex really need this explanation?" and "Does this paragraph justify its token cost?"

Prefer concise examples over verbose explanations.

### Set Appropriate Degrees of Freedom

Match the level of specificity to the task's fragility and variability:

**High freedom (text-based instructions)**: Use when multiple approaches are valid, decisions depend on context, or heuristics guide the approach.

**Medium freedom (pseudocode or scripts with parameters)**: Use when a preferred pattern exists, some variation is acceptable, or configuration affects behavior.

**Low freedom (specific scripts, few parameters)**: Use when operations are fragile and error-prone, consistency is critical, or a specific sequence must be followed.

Think of Codex as exploring a path: a narrow bridge with cliffs needs specific guardrails (low freedom), while an open field allows many routes (high freedom).

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

Every SKILL.md consists of:

- **Frontmatter** (YAML): Contains `name` and `description` fields. These are the only fields that Codex reads to determine when the skill gets used, thus it is very important to be clear and comprehensive in describing what the skill is, and when it should be used.
- **Body** (Markdown): Instructions and guidance for using the skill. Only loaded AFTER the skill triggers (if at all).

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read by Codex for patching or environment-specific adjustments

##### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Codex's process and thinking.

- **When to include**: For documentation that Codex should reference while working
- **Examples**: `references/finance.md` for financial schemas, `references/mnda.md` for company NDA template, `references/policies.md` for company policies, `references/api_docs.md` for API specifications
- **Use cases**: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
- **Benefits**: Keeps SKILL.md lean, loaded only when Codex determines it's needed
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.

##### Assets (`assets/`)

Files not intended to be loaded into context, but rather used within the output Codex produces.

- **When to include**: When the skill needs files that will be used in the final output
- **Examples**: `assets/logo.png` for brand assets, `assets/slides.pptx` for PowerPoint templates, `assets/frontend-template/` for HTML/React boilerplate, `assets/font.ttf` for typography
- **Use cases**: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
- **Benefits**: Separates output resources from documentation, enables Codex to use files without loading them into context

#### What to Not Include in a Skill

A skill should only contain essential files that directly support its functionality. Do NOT create extraneous documentation or auxiliary files, including:

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
- etc.

The skill should only contain the information needed for an AI agent to do the job at hand. It should not contain auxiliary context about the process that went into creating it, setup and testing procedures, user-facing documentation, etc. Creating additional documentation files just adds clutter and confusion.

### Progressive Disclosure Design Principle

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed by Codex (Unlimited because scripts can be executed without reading into context window)

#### Progressive Disclosure Patterns

Keep SKILL.md body to the essentials and under 500 lines to minimize context bloat. Split content into separate files when approaching this limit. When splitting out content into other files, it is very important to reference them from SKILL.md and describe clearly when to read them, to ensure the reader of the skill knows they exist and when to use them.

**Key principle:** When a skill supports multiple variations, frameworks, or options, keep only the core workflow and selection guidance in SKILL.md. Move variant-specific details (patterns, examples, configuration) into separate reference files.

**Pattern 1: High-level guide with references**

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:
[code example]

## Advanced features

- **Form filling**: See [FORMS.md](FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
```

Codex loads FORMS.md, REFERENCE.md, or EXAMPLES.md only when needed.

**Pattern 2: Domain-specific organization**

For Skills with multiple domains, organize content by domain to avoid loading irrelevant context:

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

When a user asks about sales metrics, Codex only reads sales.md.

Similarly, for skills supporting multiple frameworks or variants, organize by variant:

```
cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── references/
    ├── aws.md (AWS deployment patterns)
    ├── gcp.md (GCP deployment patterns)
    └── azure.md (Azure deployment patterns)
```

When the user chooses AWS, Codex only reads aws.md.

**Pattern 3: Conditional details**

Show basic content, link to advanced content:

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

Codex reads REDLINING.md or OOXML.md only when the user needs those features.

**Important guidelines:**

- **Avoid deeply nested references** - Keep references one level deep from SKILL.md. All reference files should link directly from SKILL.md.
- **Structure longer reference files** - For files longer than 100 lines, include a table of contents at the top so Codex can see the full scope when previewing.

## Skill Creation Process

Skill creation in `cc-harness` follows the repository standard, not an external packaging flow.

Before creating, editing, improving, or auditing a skill, read these files when they exist:

1. `docs/references/skill-standard-research.md`
2. `docs/references/skill-standard.md`
3. `docs/references/skill-pressure-scenarios.md`
4. `docs/references/review-pack-registry.md` when the skill is a review / verification pack

Follow these phases in order, skipping only when the phase clearly does not apply:

1. Resolve mode and source
2. Understand concrete examples
3. Decide whether a skill should exist
4. Define pressure scenarios when required
5. Plan reusable contents
6. Author or update `SKILL.md`
7. Add references, scripts, assets, or source attribution
8. Check installable runtime portability when required
9. Audit against the standard
10. Run validation when available
11. Report the result using the output contract

### Memory-to-Skill Promotion

Before creating a new skill from scratch, check whether the repository already has a
`Skill Promotion Candidate` recorded in feedback / recurrence memory. If such a candidate exists,
use it as the default starting point for:

1. naming the skill
2. defining scope boundaries
3. deciding what should remain a rule vs what should become a reusable workflow

When the input comes from feedback or recurrence memory, define at least one pressure scenario before writing the skill. If the request is only a one-time implementation note, current task acceptance detail, or session-only instruction, do not promote it into a skill.

### Skill Naming

- Use lowercase letters, digits, and hyphens only; normalize user-provided titles to hyphen-case (e.g., "Plan Mode" -> `plan-mode`).
- When generating names, generate a name under 64 characters (letters, digits, hyphens).
- Prefer short, verb-led phrases that describe the action.
- Namespace by tool when it improves clarity or triggering (e.g., `gh-address-comments`, `linear-address-issue`).
- Name the skill folder exactly after the skill name.

### Phase 1: Resolve Mode and Source

Classify the request:

- `create`: create a new local skill
- `edit`: change an existing skill without changing its contract
- `improve`: materially improve behavior, trigger accuracy, structure, or output
- `audit`: inspect a skill and report issues without editing unless asked
- `third-party-import`: adapt a skill, prompt, rubric, workflow, or review pack from another project
- `feedback-generated`: promote recurrence / feedback into a reusable skill
- `installable`: create or update a skill intended for `.codex/skills`, `.claude/skills`, user directories, cross-project reuse, PM gate, installer output, or distribution

For `third-party-import`, do not copy content until source URL, license, and imported commit / tag are known. If license is unclear or incompatible, record it as a candidate only.

For `audit`, inspect before editing and return a `Skill Audit Result`.

For `installable`, apply the runtime portability rules in Phase 8. Do not force those rules on simple repo-local skills unless they reference files outside their own skill directory at runtime.

### Phase 2: Understand the Skill with Concrete Examples

Skip this step only when the skill's usage patterns are already clearly understood. It remains valuable even when working with an existing skill.

To create an effective skill, clearly understand concrete examples of how the skill will be used. This understanding can come from either direct user examples or generated examples that are validated with user feedback.

For example, when building an image-editor skill, relevant questions include:

- "What functionality should the image-editor skill support? Editing, rotating, anything else?"
- "Can you give some examples of how this skill would be used?"
- "I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
- "What would a user say that should trigger this skill?"

To avoid overwhelming users, avoid asking too many questions in a single message. Start with the most important questions and follow up as needed for better effectiveness.

Conclude this step when there is a clear sense of the functionality the skill should support.

### Phase 3: Decide Whether a Skill Should Exist

Create or promote a skill when:

- The behavior should apply across future tasks, projects, or sessions
- The task requires non-obvious procedural knowledge
- The same failure has recurred or is likely to recur
- A review / test / workflow capability needs a reusable output contract
- A third-party capability should be wrapped for cc-harness use

Do not create a skill for:

- One-off implementation instructions
- Current UI acceptance notes
- Test updates tied only to the current patch
- Standard practices already enforced by code, tests, hooks, or scripts
- A rule that belongs in `AGENTS.md` or project docs instead of a reusable workflow

If the best answer is "do not create a skill", explain where the information should live instead.

Also decide whether the skill is:

- `repo-local`: used only in this repository and allowed to reference repo docs as primary context.
- `installable`: expected to work after being copied into a user runtime.
- `wrapper`: allowed to call external project files, but must document fallback / blocked behavior when they are absent.

### Phase 4: Define Pressure Scenarios When Required

Use `docs/references/skill-pressure-scenarios.md`.

Pressure scenarios are required for:

- feedback-generated skills
- review packs
- workflow, quality gate, safety, or memory-boundary skills
- skills created because an agent previously made a recurring mistake
- skills with rules the agent may rationalize away

Minimum scenario:

```markdown
### Pressure Scenario
- id:
- skill_under_test:
- user_input:
- pressure:
- failure_without_skill:
- rationalization_to_reject:
- expected_behavior_with_skill:
- evidence_required:
- status: proposed / passing / failing / exempted
```

If a pressure scenario is not needed, record the exemption reason in the result.

### Phase 5: Plan the Reusable Skill Contents

To turn concrete examples into an effective skill, analyze each example by:

1. Considering how to execute on the example from scratch
2. Identifying what scripts, references, and assets would be helpful when executing these workflows repeatedly

Example: When building a `pdf-editor` skill to handle queries like "Help me rotate this PDF," the analysis shows:

1. Rotating a PDF requires re-writing the same code each time
2. A `scripts/rotate_pdf.py` script would be helpful to store in the skill

Example: When designing a `frontend-webapp-builder` skill for queries like "Build me a todo app" or "Build me a dashboard to track my steps," the analysis shows:

1. Writing a frontend webapp requires the same boilerplate HTML/React each time
2. An `assets/hello-world/` template containing the boilerplate HTML/React project files would be helpful to store in the skill

Example: When building a `big-query` skill to handle queries like "How many users have logged in today?" the analysis shows:

1. Querying BigQuery requires re-discovering the table schemas and relationships each time
2. A `references/schema.md` file documenting the table schemas would be helpful to store in the skill

To establish the skill's contents, analyze each concrete example to create a list of the reusable resources to include: scripts, references, and assets.

### Phase 6: Author or Update the Skill

When editing the (newly-generated or existing) skill, remember that the skill is being created for another instance of Codex to use. Include information that would be beneficial and non-obvious to Codex. Consider what procedural knowledge, domain-specific details, or reusable assets would help another Codex instance execute these tasks more effectively.

Create files directly under `skills/<skill-name>/`.

Do not create `.codex/`, `.claude/`, `.claude-plugin/`, `agents/`, `examples/`, or `fixtures/` directories in this repository.

#### Reusable Skill Contents

To begin implementation, start with the reusable resources identified above: `scripts/`, `references/`, and `assets/` files. Note that this step may require user input. For example, when implementing a `brand-guidelines` skill, the user may need to provide brand assets or templates to store in `assets/`, or documentation to store in `references/`.

Added scripts must be tested by actually running them to ensure there are no bugs and that the output matches what is expected. If there are many similar scripts, only a representative sample needs to be tested to ensure confidence that they all work while balancing time to completion.

Only create resource directories that are actually required.

#### Update SKILL.md

**Writing Guidelines:** Always use imperative/infinitive form.

##### Frontmatter

Write the YAML frontmatter with `name` and `description`:

- `name`: The skill name
- `description`: This is the primary triggering mechanism for your skill, and helps Codex understand when to use the skill.
  - Include both what the Skill does and specific triggers/contexts for when to use it.
  - Include activation-critical trigger information here. The body is only loaded after triggering, so body sections cannot compensate for vague frontmatter.
  - Example description for a `docx` skill: "Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. Use when Codex needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"

Optional frontmatter may be kept when required by the host, but `name` and `description` remain the portable baseline.

##### Body

New or materially changed skills should include:

```markdown
## 何时使用
## 何时不要使用
## 输入 / 读取项
## 执行流程
## 输出格式
## 暂停 / 阻塞条件
```

Workflow skills should use numbered phases with entry and exit criteria. Review and test skills should produce a structured handoff. Skills that maintain docs or memory must state their docs-first and feedback/memory boundaries.

### Phase 7: Third-Party Source Attribution

For `third-party-import`, create `references/source.md` and add a short `## Source` section in `SKILL.md`.

Required `references/source.md` fields:

```markdown
# Source Attribution

- Source project:
- Source skill/path:
- Source URL:
- License:
- Imported commit:
- Import date:
- Local skill name:
- Local changes:
- Compatibility notes:
```

If the skill is a review pack candidate, update or reference `docs/references/review-pack-registry.md`.

### Phase 8: Check Installable Runtime Portability

Apply this phase only when the skill is `installable`, `third-party-import`, a review pack, a PM gate participant, or references runtime files outside `skills/<skill-name>/`.

Required checks:

1. Identify runtime dependencies mentioned in `SKILL.md`.
2. If a dependency is required for normal operation, place it under the skill directory:
   - `skills/<skill-name>/references/` for LLM context
   - `skills/<skill-name>/scripts/` for deterministic helpers
   - `skills/<skill-name>/assets/` for output resources
3. Treat repo-level `docs/`, top-level `scripts/`, temporary paths, and local user paths as supplemental only.
4. If the dependency cannot be bundled, write explicit fallback / blocked conditions in `SKILL.md`.
5. For installable skills, run or describe an install smoke check:

```bash
./install.sh --target codex --dest <tmpdir>
node <tmpdir>/.codex/skills/<skill-name>/scripts/<script> --help
```

Adjust the command to the actual script. If there is no script, verify required references exist under the installed skill directory.

Do not make users do this manually when the action is safe and local; run the smoke check yourself.

### Phase 9: Audit Against the Standard

Use `docs/references/skill-standard.md` as the source of truth.

Audit for `ERROR`:

- Missing `SKILL.md`
- Missing frontmatter
- Missing `name` or `description`
- `name` does not match directory name
- Invalid `name`
- Third-party skill missing `references/source.md`

Audit for `WARNING`:

- Vague description or missing trigger semantics
- Missing recommended sections
- Missing output contract
- Key skill missing pressure scenario or exemption
- Host-specific assumptions without compatibility notes
- Monolithic `SKILL.md` that should use `references/`
- Installable skill references repo-level docs/scripts as required runtime dependencies without bundled copies or blocked conditions

Do not claim a skill conforms if it has unresolved `ERROR` issues.

### Phase 10: Run Validation When Available

```bash
node scripts/checks/skill-standard.mjs
```

```bash
node scripts/checks/skill-standard.mjs --json
```

Use `--strict` only when the user or PM orchestrator asks for strict skill health checking.

### Phase 11: Report Result

For creation or update:

```markdown
### Skill Creator Result
- skill_path:
- standard_version:
- generated_sections:
- pressure_scenarios:
- source_attribution:
- runtime_portability:
- audit_status:
- validation:
- follow_up:
```

For audit:

```markdown
### Skill Audit Result
- skill_path:
- standard_version:
- errors:
- warnings:
- pressure_scenarios:
- source_attribution:
- runtime_portability:
- validation:
- recommended_fixes:
- status: PASS / WARN / FAIL / BLOCKED
```

### Phase 12: Iterate

After testing the skill, users may request improvements. Often this happens right after using the skill, with fresh context of how the skill performed.

**Iteration workflow:**

1. Use the skill on real tasks
2. Notice struggles or inefficiencies
3. Capture positive / negative examples when they should persist
4. Update pressure scenarios if the issue is behavioral
5. Identify how SKILL.md or bundled resources should be updated
6. Implement changes and validate again
