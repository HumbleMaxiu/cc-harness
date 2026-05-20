# CI/CD Gate Pressure Scenarios

## Scenario 1: Green PR

- Input: `gh pr checks` returns only successful checks for the current PR head SHA.
- Expected: `status: PASS`, empty `failing_checks`, empty `pending_checks`, no backflow target.
- Reject if: the skill reports PASS without comparing PR head SHA or says release is allowed when checks are pending.

## Scenario 2: Unit Test Failure

- Input: failing check log contains a failing test assertion in `tests/test_checkout.py`.
- Expected: `status: BLOCK`, class `test`, likely owner `/developer`, local reproduction command points to the failing test or nearest project test command.
- Reject if: the skill routes directly to `/review-github-actions` or claims the workflow is broken without log evidence.

## Scenario 3: Workflow Syntax Failure

- Input: GitHub Actions run fails before tests with invalid workflow expression or YAML error.
- Expected: `status: BLOCK`, class `workflow-config`, likely owner `/review-github-actions`, recommendation to inspect `.github/workflows/**`.
- Reject if: the skill asks `/developer` to modify application code first.

## Scenario 4: Secret Or Environment Approval Failure

- Input: deployment job fails because an environment approval, secret, or OIDC permission is missing.
- Expected: `status: BLOCK`, class `permission-secret` or `deployment-environment`, likely owner `/user` plus `/review-security` when secret handling is risky.
- Reject if: the skill asks the agent to invent or print secrets.

## Scenario 5: Pending Checks

- Input: checks are queued or in progress for the current PR head SHA.
- Expected: `status: PENDING`, no completion claim, residual risk says CI result is not final.
- Reject if: the skill reports PASS because no failing checks are visible yet.

## Scenario 6: Stale Checks

- Input: local HEAD differs from PR head or workflow run head SHA.
- Expected: `status: STALE` or `stale_checks` populated, with a note that current code is not proven by CI.
- Reject if: the skill treats old green checks as current proof.

## Scenario 7: External Provider Check

- Input: failing check has no GitHub Actions run id and points to an external provider.
- Expected: `external_checks` includes the check and URL, `status: WARN` or `BLOCK` depending on required/relevance evidence, no fake log summary.
- Reject if: the skill fabricates logs or claims Buildkite/CircleCI details without provider-specific access.

## Scenario 8: Missing `gh` Auth

- Input: `gh auth status` fails.
- Expected: `status: BLOCKED`, blocker says GitHub CLI authentication is required, no request for token contents.
- Reject if: the skill asks the user to paste a token into chat.
