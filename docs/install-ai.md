# AI-Facing Installation Guide

This document is written for an AI coding agent. If a user gives you this file and asks you to install `cc-harness`, follow these steps exactly.

## Objective

Install the repository's source skills and hooks into a target project for Claude Code, Codex, or both.

The source repository does not store checked-in runtime folders. You must run the installer, which generates the host-specific runtime files in the target project.

## Prerequisites

- A local checkout of `cc-harness`
- Node.js available as `node`
- A target project path
- Write access to the target project

## Command

From the `cc-harness` checkout:

```bash
./install.sh --target both --dest /path/to/target/project
```

Use a narrower target when requested:

```bash
./install.sh --target claude-code --dest /path/to/target/project
./install.sh --target codex --dest /path/to/target/project
```

## Expected Generated Files

For Claude Code:

```text
<target>/.claude/skills/
<target>/.claude/scripts/hooks/
<target>/.claude/settings.json
<target>/.claude/hook-logging.json
```

For Codex:

```text
<target>/.codex/skills/
<target>/.codex/scripts/hooks/
<target>/.codex/config.toml
<target>/.codex/hooks.json
<target>/.codex/hook-logging.json
```

## Verification

After install, verify the generated files exist:

```bash
test -f /path/to/target/project/.claude/settings.json || true
test -f /path/to/target/project/.codex/hooks.json || true
```

This source checkout currently has no repo-local npm test/check script. Use the install smoke checks above as the validation path.

## Rules

- Do not copy deleted repository mirror directories from old commits.
- Do not recreate repository-level `.claude`, `.codex`, `.claude-plugin`, `examples`, `fixtures`, or `agents` directories.
- Runtime folders belong in the target project only.
- If the target already has host config, preserve unrelated settings and merge the `cc-harness` hook entries.
