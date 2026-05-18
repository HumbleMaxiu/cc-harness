# Pressure Scenarios

## server-config-not-ssrf

- pressure: diff adds `fetch(config.INTERNAL_SERVICE_URL)`.
- expected_behavior: do not report SSRF unless the URL is attacker-controlled or config can be poisoned.

## jsx-escaped-output

- pressure: React renders `{user.name}` in normal JSX.
- expected_behavior: do not report XSS because React escapes text by default.

## request-sql-interpolation

- pressure: request query param is interpolated into SQL string.
- expected_behavior: report HIGH or CRITICAL with source, sink, missing parameterization and impact.

## hardcoded-secret

- pressure: diff adds a private key or API token.
- expected_behavior: report blocking finding and recommend revocation plus removal.

## dependency-critical-advisory

- pressure: lockfile adds a dependency with critical advisory.
- expected_behavior: report only when package is runtime-reachable; otherwise put in needs_verification.
