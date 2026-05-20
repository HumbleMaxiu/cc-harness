---
name: ci-cd-gate
description: 用于检查 GitHub Actions PR checks、CI 日志和发布前 CI/CD 状态；当用户或 /pm-orchestrator 需要判断 CI 是否阻断交付、定位失败原因、决定回流到 developer/tester/review packs 时使用。
---

# CI/CD Gate

`ci-cd-gate` 是只读 CI/CD gate。它读取当前分支、PR、GitHub Actions checks 和失败日志，输出交付阻断判断和回流计划。它不自动 rerun workflow、不 push、不发 PR 评论、不 merge、不 deploy。

## Source

本 skill 轻量自研，第一版参考 OpenAI GitHub plugin `gh-fix-ci` 的 GitHub Actions 检查和日志提取流程，并将 helper script 作为 Apache-2.0 兼容来源改编到 `scripts/inspect-pr-checks.py`。来源、license 和本地改动见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 用户要求检查 CI、GitHub Actions、PR checks、build logs、release readiness 或 CI/CD gate。
- `/pm-orchestrator` 进入 `CI/CD`、`quality gate` 或 `final handoff` 阶段，且当前任务有 GitHub PR 或远端 CI。
- `/tester` 本地验证通过，但远端 CI 失败或状态未知。
- `/review-github-actions` 或 `/review-security` 发现 workflow/security scanner 风险，需要 CI/CD gate 汇总交付状态。

## 何时不要使用

- 只需要审查 workflow 安全漏洞：使用 `/review-github-actions`。
- 只需要本地测试、lint、typecheck、build：使用 `/tester`。
- 只需要普通代码审查：使用 `/reviewer`。
- 用户要求 rerun workflow、push fix、post PR comment、merge 或 deploy：先由 `/pm-orchestrator` 执行 operation gate；本 skill 只读。
- 非 GitHub Actions provider 的深度诊断：v1 仅 report-only，并返回 `external_checks`。

## 输入 / 读取项

- 当前 repo、branch、local HEAD SHA。
- PR number 或 URL；没有显式 PR 时用 `gh pr view --json number,url,headRefOid,headRefName` 解析当前分支 PR。
- `gh pr checks` 输出。
- GitHub Actions run metadata 和失败日志。
- `Developer Result`、`Tester Handoff`、PM Run Trace 或 active exec plan，如果存在。
- `.github/workflows/**`、`action.yml`、`.github/actions/**`，仅在失败指向 workflow/config/security 时读取。
- `docs/memory/feedback/prevents-recurrence.md`，如果存在。

## 执行流程

1. 确认 `gh` 可用并已认证：运行 `gh auth status`。失败时返回 `BLOCKED`，不要要求用户提供 token 内容。
2. 解析 repo、branch、local HEAD SHA 和 PR。无法解析 PR 时返回 `BLOCKED`，除非用户只要求 branch-level report。
3. 运行 `scripts/inspect-pr-checks.py --repo . --pr <number-or-url> --json` 获取 failing/pending/external/stale check 摘要。
4. 如果 helper 不可用，使用手动 fallback：
   - `gh pr checks <pr> --json name,state,conclusion,detailsUrl,startedAt,completedAt`
   - `gh run view <run_id> --json name,workflowName,conclusion,status,url,event,headBranch,headSha`
   - `gh run view <run_id> --log-failed`
5. 判断 CI 是否对应当前代码：比较 local HEAD、PR remote head 和 run head SHA；不一致时返回 `STALE` 或将对应 check 放入 `stale_checks`。
6. 将失败分类为 test、lint、typecheck、build、dependency-install、workflow-config、permission-secret、deployment-environment、flaky-timeout、security-scan、external-provider 或 unknown。
7. 为每个失败指定 `likely_owner`：
   - test/lint/typecheck/build: `/developer` 或 `/tester`
   - workflow-config: `/review-github-actions`
   - permission-secret/security-scan: `/review-security` plus `/review-github-actions`
   - deployment-environment: `/user`
   - external-provider: `/user` or future provider-specific gate
8. 推断本地复现命令，只列出能从日志或 repo scripts 中得到证据的命令；不能推断时说明 `requires_manual_selection`。
9. 输出 `CI/CD Gate Result`。不要声称 PASS，除非已确认当前 PR/commit 没有 failing 或 pending required checks。

## 输出格式

```markdown
### CI/CD Gate Result
- capability: ci_cd_gate
- source_skill: /ci-cd-gate
- provider: github-actions
- repo:
- branch:
- pr:
- local_head_sha:
- remote_head_sha:
- inspected_checks:
- failing_checks:
- pending_checks:
- external_checks:
- stale_checks:
- failure_classification:
  - check:
    class: test / lint / typecheck / build / dependency-install / workflow-config / permission-secret / deployment-environment / flaky-timeout / security-scan / external-provider / unknown
    confidence: HIGH / MEDIUM / LOW
    evidence:
    likely_owner: /developer /tester /review-github-actions /review-security /user
- local_reproduction:
  - command:
    rationale:
    requires_secrets: true / false
- backflow_plan:
- external_actions_needed:
- residual_risks:
- status: PASS / WARN / BLOCK / PENDING / STALE / BLOCKED
```

## 暂停 / 阻塞条件

- `gh` 未安装或未认证。
- 当前分支无法关联 PR，且用户没有提供 PR number 或 URL。
- GitHub Actions logs 不可访问，且 failure classification 依赖 logs。
- CI failure 需要 secret、environment approval、deployment credential 或 maintainer-only action。
- 用户要求产生外部副作用，但 PM operation gate 尚未确认。

## 可选工具

- `gh`：v1 必需，用于读取 PR checks、workflow run metadata 和 logs。
- `scripts/inspect-pr-checks.py`：skill-local helper，优先使用。
- `actionlint`：当失败指向 workflow syntax 或 expression 时，可交给 `/review-github-actions` 使用。
- `zizmor`：当失败或改动指向 GitHub Actions security risk 时，可交给 `/review-github-actions` 使用。
- `reviewdog`：未来用于 PR annotations；v1 不默认使用。
- `act`：未来用于本地复现 GitHub Actions；v1 不默认使用。
