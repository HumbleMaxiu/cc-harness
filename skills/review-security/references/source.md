# Source Attribution

## Sentry Security Review

- Source project: `getsentry/skills`
- Source skill/path: `skills/security-review/SKILL.md`
- Source URL: `https://github.com/getsentry/skills/tree/main/skills/security-review`
- License: Apache-2.0
- Imported commit: `58c611d2b05403f8e53c0b340bc9a574f8cdd4f0` (reference snapshot, no copied prose)
- Import date: 2026-05-18
- Local skill name: `review-security`
- Local changes: lightweight cc-harness wrapper; no copied prose; adopts high-confidence, data-flow-before-reporting review discipline.
- Compatibility notes: output adapted to cc-harness `Review Handoff`; Sentry-specific policy removed.

## Optional Tool References

- Source project: `semgrep/semgrep`
- Source URL: `https://github.com/semgrep/semgrep`
- License: LGPL-2.1
- Local use: optional evidence source for static security patterns.

- Source project: `gitleaks/gitleaks`
- Source URL: `https://github.com/gitleaks/gitleaks`
- License: MIT
- Local use: optional evidence source for secret detection.

- Source project: `google/osv-scanner`
- Source URL: `https://github.com/google/osv-scanner`
- License: Apache-2.0
- Local use: optional evidence source for dependency vulnerabilities.
