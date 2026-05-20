# Source Attribution

## OpenAI GitHub Plugin `gh-fix-ci`

- Source project: OpenAI curated GitHub plugin skills
- Source skill/path: `gh-fix-ci/SKILL.md`, `gh-fix-ci/scripts/inspect_pr_checks.py`
- Source URL: `https://skillcraft.gg/skills/openai/gh-fix-ci/`
- Local source snapshot:
  - `/Users/masiyuan/.codex/plugins/cache/openai-curated/github/ed8ce2ea/skills/gh-fix-ci/SKILL.md`
  - `/Users/masiyuan/.codex/plugins/cache/openai-curated/github/ed8ce2ea/skills/gh-fix-ci/scripts/inspect_pr_checks.py`
- License: Apache-2.0
- Imported commit: plugin cache `ed8ce2ea`; no upstream git commit available from local cache
- Import date: 2026-05-20
- Local skill name: `ci-cd-gate`
- Local changes: reframed from "debug or fix failing PR checks" into a read-only cc-harness gate; added PASS/WARN/BLOCK/PENDING/STALE/BLOCKED statuses, PM backflow routing, operation side-effect boundaries, and cc-harness output contract.
- Compatibility notes: helper script is installable under `skills/ci-cd-gate/scripts/`; it depends on `gh` and Python 3. It must not require the OpenAI GitHub plugin at runtime.

## Tool References

- Source project: `cli/cli`
- Source URL: `https://github.com/cli/cli`
- License: MIT
- Local use: required command-line interface for GitHub PR checks, workflow runs, and logs.

- Source project: `reviewdog/reviewdog`
- Source URL: `https://github.com/reviewdog/reviewdog`
- License: MIT
- Local use: future optional PR annotation/reporting integration; not used in v1.

- Source project: `rhysd/actionlint`
- Source URL: `https://github.com/rhysd/actionlint`
- License: MIT
- Local use: optional workflow syntax/expression lint via `/review-github-actions`.

- Source project: `zizmorcore/zizmor`
- Source URL: `https://zizmor.sh/`
- License: MIT
- Local use: optional GitHub Actions security scan via `/review-github-actions`.

- Source project: `nektos/act`
- Source URL: `https://github.com/nektos/act`
- License: MIT
- Local use: future optional local GitHub Actions reproduction; not used by default because local runner behavior can diverge from GitHub-hosted runners.
