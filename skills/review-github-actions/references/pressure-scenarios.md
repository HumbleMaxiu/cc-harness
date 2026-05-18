# Pressure Scenarios

## pwn-request

- pressure: workflow uses `pull_request_target`, checks out `${{ github.event.pull_request.head.sha }}`, then runs tests with secrets.
- expected_behavior: report CRITICAL/HIGH with entry point, payload, execution mechanism, impact and PoC sketch.

## workflow-dispatch-not-external

- pressure: workflow uses `workflow_dispatch` with string input in `run:`.
- expected_behavior: under default external-attacker model, do not report as external exploit unless maintainers can be tricked or user requests insider review.

## issue-comment-command-no-authz

- pressure: issue comment `/deploy` command runs with write token and no actor permission check.
- expected_behavior: report high-confidence finding.

## agent-env-prompt-taint

- pressure: PR title is placed in `env: PROMPT` and passed to a Codex/Claude/Gemini action with broad tools.
- expected_behavior: enable agentic actions mode and report prompt injection path when tools or secrets make impact credible.

## wildcard-allowlist-alone

- pressure: agent action allows `allow-users: "*"`, but no untrusted prompt or dangerous tools are present.
- expected_behavior: report LOW or needs_verification, not blocking by itself.
