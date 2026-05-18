# Source Attribution

## Optional Tool References

- Source project: `dequelabs/axe-core`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/dequelabs/axe-core/tree/3a012a141f56b76d6a58fcfb01598ba45e91a442`
- License: MPL-2.0
- Imported commit: `3a012a141f56b76d6a58fcfb01598ba45e91a442` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-frontend`
- Local changes: tool used only as optional evidence source; no copied prose.
- Compatibility notes: no axe-core content is copied; findings from tool output must be mapped to cc-harness `Review Handoff`.

- Source project: `pa11y/pa11y-ci`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/pa11y/pa11y-ci/tree/db624756dc21a3e6d41e984f94ac1551e7969e05`
- License: LGPL-3.0
- Imported commit: `db624756dc21a3e6d41e984f94ac1551e7969e05` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-frontend`
- Local changes: optional accessibility evidence source; no copied prose.
- Compatibility notes: tool output is advisory and must not become blocking without scoped code or UI evidence.

- Source project: `GoogleChrome/lighthouse-ci`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/GoogleChrome/lighthouse-ci/tree/ebee453dad3f8acacd657a62ccc65e3296afb7d0`
- License: Apache-2.0
- Imported commit: `ebee453dad3f8acacd657a62ccc65e3296afb7d0` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-frontend`
- Local changes: optional web quality and performance-adjacent evidence source; no copied prose.
- Compatibility notes: use only as review evidence; route dedicated performance concerns to `/review-performance` if installed, otherwise `/reviewer`.

- Source project: `microsoft/playwright`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/microsoft/playwright/tree/72bbd1d964a87855c4b067b135458535c825712f`
- License: Apache-2.0
- Imported commit: `72bbd1d964a87855c4b067b135458535c825712f` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-frontend`
- Local changes: optional browser interaction evidence source; no copied prose.
- Compatibility notes: `/review-frontend` does not run or replace browser verification; Playwright evidence should be mapped into `Review Handoff` or routed to `/tester` / `/ui-verify`.
