# Source Attribution

## Optional Tool References

- Source project: `GoogleChrome/lighthouse-ci`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/GoogleChrome/lighthouse-ci/tree/ebee453dad3f8acacd657a62ccc65e3296afb7d0`
- License: Apache-2.0
- Imported commit: `ebee453dad3f8acacd657a62ccc65e3296afb7d0` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-performance`
- Local changes: optional web performance evidence source; no copied prose.
- Compatibility notes: tool output is advisory and must be mapped to cc-harness `Review Handoff`; this skill does not replace full profiling or benchmark work.

- Source project: `ai/size-limit`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/ai/size-limit/tree/60f56288969bfc93be9e01413f3a34923cfca8b1`
- License: MIT
- Imported commit: `60f56288969bfc93be9e01413f3a34923cfca8b1` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-performance`
- Local changes: optional bundle impact evidence source; no copied prose.
- Compatibility notes: use output as supporting evidence only; absence of size-limit data should not block review unless bundle scope cannot otherwise be identified.

- Source project: `webpack-contrib/webpack-bundle-analyzer`
- Source skill/path: repository root (tool repository, not a skill)
- Source URL: `https://github.com/webpack-contrib/webpack-bundle-analyzer/tree/9ba43c79a0113d3fd35dbcc55a637ffebaad7581`
- License: MIT
- Imported commit: `9ba43c79a0113d3fd35dbcc55a637ffebaad7581` (immutable reference snapshot)
- Import date: 2026-05-18
- Local skill name: `review-performance`
- Local changes: optional bundle composition evidence source; no copied prose.
- Compatibility notes: use analyzer output to support review findings, not as an automatic blocker.

## Local Notes

- This skill is cc-harness-authored review guidance. It does not copy upstream tool prose or implementation.
- Project-native benchmarks, profiler output and database EXPLAIN plans are treated as local evidence sources and do not imply imported third-party content.
