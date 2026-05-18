# Review Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add four lightweight review packs that `/pm-orchestrator` can schedule with `/reviewer`: `/review-security`, `/review-github-actions`, `/review-frontend`, and `/review-performance`.

**Architecture:** Keep `/reviewer` as the baseline code review skill. Add four read-only specialized review skills under `skills/`, each with local `references/source.md` and `references/pressure-scenarios.md`, a shared `Review Handoff` output contract, and PM routing rules. Update registry/docs only after the skills exist and pass skill standard checks.

**Tech Stack:** Markdown skills, cc-harness Skill Standard, Node skill audit scripts, installer smoke via `install.sh`.

---

## Source Spec

- Design: `docs/superpowers/specs/2026-05-18-review-packs-design.md`
- Existing registry: `docs/references/review-pack-registry.md`
- Skill standard: `docs/references/skill-standard.md`

## File Structure

Create:

- `skills/review-security/SKILL.md` — high-confidence application/security review pack.
- `skills/review-security/references/source.md` — source attribution for Sentry security review and tool references.
- `skills/review-security/references/pressure-scenarios.md` — false-positive and exploit-path scenarios.
- `skills/review-github-actions/SKILL.md` — GitHub Actions and agentic workflow security review pack.
- `skills/review-github-actions/references/source.md` — source attribution for Sentry GHA and Trail of Bits agentic-actions-auditor ideas.
- `skills/review-github-actions/references/pressure-scenarios.md` — GHA and AI-agent workflow scenarios.
- `skills/review-frontend/SKILL.md` — frontend correctness/accessibility/interaction review pack.
- `skills/review-frontend/references/source.md` — source attribution for frontend tool references.
- `skills/review-frontend/references/pressure-scenarios.md` — frontend review behavior scenarios.
- `skills/review-performance/SKILL.md` — performance risk review pack.
- `skills/review-performance/references/source.md` — source attribution for performance tool references.
- `skills/review-performance/references/pressure-scenarios.md` — performance risk scenarios.

Modify:

- `scripts/checks/skill-standard.mjs` — add the four review packs to `keySkills`.
- `skills/skill-audit/scripts/skill-standard.mjs` — mirror the same `keySkills` update.
- `docs/references/review-pack-registry.md` — mark the four packs as implemented-local and align capability names.
- `skills/pm-orchestrator/SKILL.md` — add explicit review-pack scheduling rules.
- `README.md` — list the four review packs.
- `AGENTS.md` — list the four review packs.
- `docs/product-specs/skill-system.md` — describe implemented review packs.
- `docs/product-specs/agent-system.md` — add review-pack role entries.
- `docs/guides/harness-guide.md` — show when PM routes review packs.
- `docs/exec-plans/index.md` — track this active plan and later move it to completed.

Do not modify unrelated developer/TDD files except where `skills/pm-orchestrator/SKILL.md` already has active changes and must be carefully merged.

## Shared Output Contract

Every review pack `SKILL.md` must include this exact handoff shape:

```markdown
### Review Handoff
- capability:
- source_skill:
- review_scope:
- files_reviewed:
- context_read:
- tools_available:
- tools_run:
- findings:
  - id:
    severity: CRITICAL / HIGH / MEDIUM / LOW
    confidence: HIGH / MEDIUM / LOW
    blocking: true / false
    location:
    evidence:
    impact:
    recommendation:
    verification:
- needs_verification:
- reviewed_and_cleared:
- false_positive_notes:
- status: APPROVED / REJECTED / BLOCKED
```

## Task 1: Add `/review-security`

**Files:**

- Create: `skills/review-security/SKILL.md`
- Create: `skills/review-security/references/source.md`
- Create: `skills/review-security/references/pressure-scenarios.md`
- Test: `node skills/skill-audit/scripts/skill-standard.mjs --skill review-security --json`

- [x] **Step 1: Write the failing audit check**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-security --json
```

Expected: non-zero or JSON error indicating `skill not found: review-security`.

- [x] **Step 2: Create `skills/review-security/SKILL.md`**

Use this content:

```markdown
---
name: review-security
description: 用于审查涉及 auth、permissions、secrets、tenant boundary、injection、external request、shell/SQL execution、dependency risk 的代码变更；当 /pm-orchestrator 或用户需要高置信安全审查时使用。
---

# Security Review

`review-security` 是只读专项 review pack。它不替代 `/reviewer`，也不修改代码；它只在高风险安全变更中输出高置信 `Review Handoff`。

## Source

本 skill 轻量自研，参考 Sentry `security-review` 的 high-confidence review discipline，并将 Semgrep、Gitleaks、OSV-Scanner 作为可选工具槽。来源、license 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 auth、authorization、permissions、tenant boundary、admin actions。
- 变更涉及 secrets、tokens、sessions、crypto、payment、billing。
- 变更涉及 request parsing、redirects、external requests、file upload/download。
- 变更涉及 SQL/NoSQL query、shell execution、template rendering、unsafe deserialization。
- 变更涉及 dependency、lockfile 或 package manager config，且尚无专门 supply-chain pack。

## 何时不要使用

- 普通代码风格、架构或测试质量审查：使用 `/reviewer`。
- GitHub Actions workflow 安全审查：使用 `/review-github-actions`。
- UI 状态、a11y、responsive 审查：使用 `/review-frontend`。
- 性能风险审查：使用 `/review-performance`。
- 需要修复代码：回流 `/developer`，本 skill 只读。

## 输入 / 读取项

- `git diff` 或 PM 提供的 changed files。
- `plan_path`、`task_id`、`step_scope`、spec refs 和 Developer Result。
- 相关路由、handler、model、schema、middleware、policy、config、tests。
- `docs/memory/feedback/prevents-recurrence.md`，如果存在。
- 可选工具输出：Semgrep、Gitleaks、OSV-Scanner 或项目原生 security checks。

## 执行流程

1. 定义 review scope：列出 changed files、security-sensitive paths 和需要读取的上下文。
2. 从 diff 出发寻找 source、sink、trust boundary 和 mitigation。
3. 区分 attacker-controlled input、trusted service config、repo-local constants 和 framework-protected output。
4. 只在能连接 `source -> data flow -> missing mitigation -> impact` 时报告 blocking finding。
5. 没有完整 exploit path 的疑点写入 `needs_verification`，不要包装成 blocking finding。
6. 如果可用，运行或引用 Semgrep、Gitleaks、OSV-Scanner；工具输出必须经过人工高置信复核。
7. 输出 `Review Handoff`。

## 输出格式

```markdown
### Review Handoff
- capability: security_review
- source_skill: /review-security
- review_scope:
- files_reviewed:
- context_read:
- tools_available:
- tools_run:
- findings:
  - id:
    severity: CRITICAL / HIGH / MEDIUM / LOW
    confidence: HIGH / MEDIUM / LOW
    blocking: true / false
    location:
    evidence:
    impact:
    recommendation:
    verification:
- needs_verification:
- reviewed_and_cleared:
- false_positive_notes:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- PM 没有提供 diff、changed files 或 review scope。
- 关键上下文不可读，导致无法判断 trust boundary。
- 工具输出声称 critical 但无法定位代码证据。
- 用户要求执行会产生外部副作用的扫描或上传。

## 可选工具

- `semgrep`：模式扫描，不能替代 data-flow reasoning。
- `gitleaks`：secret 扫描。
- `osv-scanner`：依赖漏洞扫描。
- 项目原生 security checks。
```

- [x] **Step 3: Create `skills/review-security/references/source.md`**

Use this content:

```markdown
# Source Attribution

## Sentry Security Review

- Source project: `getsentry/skills`
- Source skill/path: `skills/security-review/SKILL.md`
- Source URL: `https://github.com/getsentry/skills/tree/main/skills/security-review`
- License: Apache-2.0
- Imported commit: reference-only, record exact commit during implementation if content is copied
- Import date: 2026-05-18
- Local skill name: `review-security`
- Local changes: lightweight cc-harness wrapper; no wholesale copy; adopts high-confidence, data-flow-before-reporting review discipline.
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
```

- [x] **Step 4: Create `skills/review-security/references/pressure-scenarios.md`**

Use this content:

```markdown
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
```

- [x] **Step 5: Run targeted audit**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-security --json
```

Expected: `errors: 0`, `warnings: 0`.

## Task 2: Add `/review-github-actions`

**Files:**

- Create: `skills/review-github-actions/SKILL.md`
- Create: `skills/review-github-actions/references/source.md`
- Create: `skills/review-github-actions/references/pressure-scenarios.md`
- Test: `node skills/skill-audit/scripts/skill-standard.mjs --skill review-github-actions --json`

- [x] **Step 1: Write the failing audit check**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-github-actions --json
```

Expected: non-zero or JSON error indicating `skill not found: review-github-actions`.

- [x] **Step 2: Create `skills/review-github-actions/SKILL.md`**

Use this content:

```markdown
---
name: review-github-actions
description: 用于审查 .github/workflows、local actions、CI scripts 和 AI agent GitHub Actions 的安全风险；当 /pm-orchestrator 或用户需要 GitHub Actions security review 时使用。
---

# GitHub Actions Review

`review-github-actions` 是只读专项 review pack。它审查 GitHub Actions workflow、local composite actions、workflow-loaded scripts，以及 CI 中 AI agent action 的攻击路径。

## Source

本 skill 轻量自研，参考 Sentry `gha-security-review` 的外部攻击者 threat model，并吸收 Trail of Bits `agentic-actions-auditor` 的 AI agent workflow taint-tracking 思路。来源、license 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 `.github/workflows/*.yml` 或 `.github/workflows/*.yaml`。
- 变更涉及 `action.yml`、`action.yaml`、`.github/actions/**`。
- 变更涉及 workflow 加载的 shell scripts、Makefile、agent instructions 或 repo config。
- workflow 使用 Claude、Codex、Gemini、AI inference 或其他 coding agent action。

## 何时不要使用

- 普通应用安全审查：使用 `/review-security`。
- CI 失败排查和自动修复：使用 `/ci-cd-gate` 或 GitHub CI skill。
- GitHub Actions 以外的 deployment config：由 PM 选择 `/review-security` 或 `/reviewer`。
- 需要修改 workflow：回流 `/developer`，本 skill 只读。

## 输入 / 读取项

- 变更的 workflow、local action、reusable workflow 和被 workflow 调用的 scripts/config。
- PM policy、plan refs、Developer Result。
- 默认 attacker model：无 repo 写权限，但可开 fork PR、创建 issue/comment、控制 PR metadata 和 PR content。
- 可选工具输出：zizmor、actionlint。

## 执行流程

1. 收集 workflow entry points：trigger、permissions、jobs、steps、checkout、secrets、runner。
2. 按默认外部攻击者模型判断可控输入：PR title/body/branch/content、issue body/comment、workflow event payload。
3. 检查 pwn request：`pull_request_target` 与 fork-controlled checkout/execution 的组合。
4. 检查 expression/script injection：`${{ github.event.* }}` 进入 `run:`、shell、env、prompt 或 config。
5. 检查 token、secret、permissions、self-hosted runner、cache、artifact、unpinned action 风险。
6. 如果发现 AI agent action，启用 agentic actions mode。
7. 高置信 finding 必须写出 entry point、payload、execution mechanism、impact 和 PoC sketch。
8. 输出 `Review Handoff`。

## Agentic Actions Mode

检测至少这些 action 或等价模式：

- `anthropics/claude-code-action`
- `google-github-actions/run-gemini-cli`
- `google-gemini/gemini-cli-action`
- `openai/codex-action`
- `actions/ai-inference`

额外检查：

- GitHub event data 通过 `env:` 进入 prompt。
- 直接把 event expression 写入 prompt。
- prompt 或 CLI 在运行时抓取 PR/issue/comment 内容。
- `pull_request_target` 后 checkout fork code。
- CI logs 或 build output 被喂给 agent。
- allowed tools 仍允许 shell expansion、env leakage 或危险文件写。
- AI output 被 eval/exec。
- sandbox 使用 `danger-full-access`、`--yolo` 或 unsafe mode。
- wildcard allowlist 允许任意外部用户触发 agent。

## 输出格式

```markdown
### Review Handoff
- capability: github_actions_review
- source_skill: /review-github-actions
- review_scope:
- files_reviewed:
- context_read:
- tools_available:
- tools_run:
- findings:
  - id:
    severity: CRITICAL / HIGH / MEDIUM / LOW
    confidence: HIGH / MEDIUM / LOW
    blocking: true / false
    location:
    evidence:
    impact:
    recommendation:
    verification:
- needs_verification:
- reviewed_and_cleared:
- false_positive_notes:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- Changed workflow is generated or remote-only and cannot be inspected.
- Reusable workflow source is unavailable and security depends on it.
- User asks to fetch private remote workflows but credentials are unavailable.
- Tool output cannot be mapped to a workflow location.

## 可选工具

- `zizmor`：GitHub Actions security scanner。
- `actionlint`：workflow syntax、expression 和 shell-adjacent lint。
- `gh`：仅在用户授权且 credentials 可用时读取 remote workflow metadata。
```

- [x] **Step 3: Create `skills/review-github-actions/references/source.md`**

Use this content:

```markdown
# Source Attribution

## Sentry GHA Security Review

- Source project: `getsentry/skills`
- Source skill/path: `skills/gha-security-review/SKILL.md`
- Source URL: `https://github.com/getsentry/skills/tree/main/skills/gha-security-review`
- License: Apache-2.0
- Imported commit: reference-only, record exact commit during implementation if content is copied
- Import date: 2026-05-18
- Local skill name: `review-github-actions`
- Local changes: lightweight cc-harness wrapper; adopts external-attacker threat model and PoC requirement.
- Compatibility notes: output adapted to cc-harness `Review Handoff`.

## Trail of Bits Agentic Actions Auditor

- Source project: `trailofbits/skills`
- Source skill/path: `plugins/agentic-actions-auditor/skills/agentic-actions-auditor/SKILL.md`
- Source URL: `https://github.com/trailofbits/skills/tree/main/plugins/agentic-actions-auditor/skills/agentic-actions-auditor`
- License: CC-BY-SA-4.0
- Imported commit: reference-only, no copied text
- Import date: 2026-05-18
- Local skill name: `review-github-actions`
- Local changes: agentic review is a mode inside `/review-github-actions`, not a separate first-version pack.
- Compatibility notes: due to CC-BY-SA-4.0, use ideas as reference and do not copy content wholesale.

## Optional Tool References

- Source project: `zizmorcore/zizmor`
- Source URL: `https://github.com/zizmorcore/zizmor`
- License: MIT
- Local use: optional GitHub Actions security evidence.

- Source project: `rhysd/actionlint`
- Source URL: `https://github.com/rhysd/actionlint`
- License: MIT
- Local use: optional workflow lint evidence.
```

- [x] **Step 4: Create `skills/review-github-actions/references/pressure-scenarios.md`**

Use this content:

```markdown
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
```

- [x] **Step 5: Run targeted audit**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-github-actions --json
```

Expected: `errors: 0`, `warnings: 0`.

## Task 3: Add `/review-frontend`

**Files:**

- Create: `skills/review-frontend/SKILL.md`
- Create: `skills/review-frontend/references/source.md`
- Create: `skills/review-frontend/references/pressure-scenarios.md`
- Test: `node skills/skill-audit/scripts/skill-standard.mjs --skill review-frontend --json`

- [x] **Step 1: Write the failing audit check**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-frontend --json
```

Expected: non-zero or JSON error indicating `skill not found: review-frontend`.

- [x] **Step 2: Create `skills/review-frontend/SKILL.md`**

Use this content:

```markdown
---
name: review-frontend
description: 用于审查 UI components、pages、forms、navigation、loading/error/empty states、accessibility、responsive 和 visual behavior 变更；当 /pm-orchestrator 或用户需要前端专项 review 时使用。
---

# Frontend Review

`review-frontend` 是只读专项 review pack。它审查 UI 行为、可访问性、状态流和响应式风险，不替代 `/tester`、`/ui-verify` 或真实浏览器验证。

## Source

本 skill 轻量自研，参考 axe-core、Pa11y、Lighthouse CI 和 Playwright/webapp verification 的证据模式作为可选工具槽。来源、license 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 UI components、pages、layouts、forms、navigation。
- 变更涉及 loading、empty、error、disabled、optimistic states。
- 变更涉及 keyboard interaction、focus management、ARIA、semantic HTML。
- 变更涉及 responsive layout、text overflow、visual behavior 或 design-system changes。

## 何时不要使用

- 需要实际浏览器点击、截图或视觉验收：使用 `/tester` 或 `/ui-verify`。
- 普通业务逻辑审查：使用 `/reviewer`。
- 安全或 performance 专项审查：使用对应 review pack。
- 需要修改 UI 代码：回流 `/developer`。

## 输入 / 读取项

- UI diff、component/page files、styles、tests、stories、design refs。
- PM policy、plan refs、Developer Result。
- 可选验证证据：axe-core、Pa11y、Playwright、browser screenshots、component tests、storybook output。

## 执行流程

1. 定义 changed UI surface：user action、visible state、affected viewport 或 assistive tech surface。
2. 阅读组件调用方、state owner、form handlers、styles 和 tests/stories。
3. 检查 loading/empty/error/disabled/success 状态是否完整且不会互相遮挡。
4. 检查 keyboard access、focus return、accessible name、semantic roles。
5. 检查 responsive constraints、text wrapping、overflow、hit target 和 design-system consistency。
6. 对缺少真实浏览器证据的高风险视觉问题，写入 `needs_verification`。
7. 输出 `Review Handoff`。

## 输出格式

```markdown
### Review Handoff
- capability: frontend_review
- source_skill: /review-frontend
- review_scope:
- files_reviewed:
- context_read:
- tools_available:
- tools_run:
- findings:
  - id:
    severity: CRITICAL / HIGH / MEDIUM / LOW
    confidence: HIGH / MEDIUM / LOW
    blocking: true / false
    location:
    evidence:
    impact:
    recommendation:
    verification:
- needs_verification:
- reviewed_and_cleared:
- false_positive_notes:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- UI behavior depends on unavailable design/spec context.
- The risk can only be confirmed in a browser and no local app or screenshots are available.
- Component contract is unclear and caller context is missing.

## 可选工具

- `axe-core` or Pa11y for accessibility evidence.
- Playwright or webapp testing for interaction evidence.
- Browser screenshots for visual risk.
- Project-native component tests or stories.
```

- [x] **Step 3: Create `skills/review-frontend/references/source.md`**

Use this content:

```markdown
# Source Attribution

## Optional Tool References

- Source project: `dequelabs/axe-core`
- Source URL: `https://github.com/dequelabs/axe-core`
- License: MPL-2.0
- Imported commit: reference-only
- Import date: 2026-05-18
- Local skill name: `review-frontend`
- Local changes: tool used only as optional evidence source.
- Compatibility notes: no axe-core content is copied.

- Source project: `pa11y/pa11y-ci`
- Source URL: `https://github.com/pa11y/pa11y-ci`
- License: LGPL-3.0
- Local use: optional accessibility evidence source.

- Source project: `GoogleChrome/lighthouse-ci`
- Source URL: `https://github.com/GoogleChrome/lighthouse-ci`
- License: Apache-2.0
- Local use: optional web quality and performance evidence source.
```

- [x] **Step 4: Create `skills/review-frontend/references/pressure-scenarios.md`**

Use this content:

```markdown
# Pressure Scenarios

## missing-accessible-name

- pressure: icon-only submit button has no aria-label or visible text.
- expected_behavior: report accessibility finding with affected control and recommendation.

## broken-focus-return

- pressure: modal closes but focus is not returned to trigger.
- expected_behavior: report keyboard interaction risk or needs_verification if runtime behavior cannot be confirmed.

## double-submit-loading

- pressure: form shows loading spinner but submit button remains enabled.
- expected_behavior: report duplicate action risk.

## harmless-spacing-change

- pressure: CSS margin changes in isolated component with no overflow or interaction impact.
- expected_behavior: do not block; optionally note no findings.
```

- [x] **Step 5: Run targeted audit**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-frontend --json
```

Expected: `errors: 0`, `warnings: 0`.

## Task 4: Add `/review-performance`

**Files:**

- Create: `skills/review-performance/SKILL.md`
- Create: `skills/review-performance/references/source.md`
- Create: `skills/review-performance/references/pressure-scenarios.md`
- Test: `node skills/skill-audit/scripts/skill-standard.mjs --skill review-performance --json`

- [x] **Step 1: Write the failing audit check**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-performance --json
```

Expected: non-zero or JSON error indicating `skill not found: review-performance`.

- [x] **Step 2: Create `skills/review-performance/SKILL.md`**

Use this content:

```markdown
---
name: review-performance
description: 用于审查 hot paths、queries、cache、pagination、API fan-out、large lists、bundle size 和 expensive render/computation 的性能风险；当 /pm-orchestrator 或用户需要性能专项 review 时使用。
---

# Performance Review

`review-performance` 是只读专项 review pack。它审查高信号性能风险，不做完整 profiling，不报告没有证据的微优化建议。

## Source

本 skill 轻量自研，参考 Lighthouse CI、size-limit、bundle analyzer 和项目原生 benchmark/profiling 的证据模式作为可选工具槽。来源、license 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 hot paths、loops、queries、pagination、cache、background jobs。
- 变更涉及 API fan-out、network calls、serialization、expensive computation。
- 变更涉及 frontend render path、large lists、images/media、bundle size。
- 变更新增大型 dependency 或 runtime-heavy code。

## 何时不要使用

- 普通代码质量审查：使用 `/reviewer`。
- 安全风险审查：使用 `/review-security`。
- UI correctness/a11y 审查：使用 `/review-frontend`。
- 需要实际 benchmark 或 profiling 才能判断且没有证据：写入 `needs_verification`。

## 输入 / 读取项

- Diff、changed files、call sites、query paths、cache keys、tests、benchmarks。
- PM policy、plan refs、Developer Result。
- 可选证据：Lighthouse CI、size-limit、bundle analyzer、project-native benchmarks、EXPLAIN plans。

## 执行流程

1. 定义 performance-sensitive surface：request path、UI render path、job path、query path 或 bundle path。
2. 阅读 caller/callee context，判断是否 hot path 或 data-size dependent。
3. 检查 N+1 queries、unbounded reads、missing pagination、unbounded loops。
4. 检查 cache key、invalidation、accidental bypass、API fan-out。
5. 检查 frontend re-render、large list handling、image/media loading、bundle impact。
6. 没有明确 impact 的微优化建议不要 blocking；写入 `reviewed_and_cleared` 或 `needs_verification`。
7. 输出 `Review Handoff`。

## 输出格式

```markdown
### Review Handoff
- capability: performance_review
- source_skill: /review-performance
- review_scope:
- files_reviewed:
- context_read:
- tools_available:
- tools_run:
- findings:
  - id:
    severity: CRITICAL / HIGH / MEDIUM / LOW
    confidence: HIGH / MEDIUM / LOW
    blocking: true / false
    location:
    evidence:
    impact:
    recommendation:
    verification:
- needs_verification:
- reviewed_and_cleared:
- false_positive_notes:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- Performance claim depends on unavailable production metrics or profiling artifacts.
- Query/schema/caller context is unavailable.
- The requested review would require running expensive external benchmarks.

## 可选工具

- Project-native benchmarks or performance tests.
- Lighthouse CI for web performance evidence.
- `size-limit` or bundle analyzer for frontend bundle impact.
- Database EXPLAIN plans when repo conventions support them.
```

- [x] **Step 3: Create `skills/review-performance/references/source.md`**

Use this content:

```markdown
# Source Attribution

## Optional Tool References

- Source project: `GoogleChrome/lighthouse-ci`
- Source URL: `https://github.com/GoogleChrome/lighthouse-ci`
- License: Apache-2.0
- Imported commit: reference-only
- Import date: 2026-05-18
- Local skill name: `review-performance`
- Local changes: tool used only as optional evidence source.
- Compatibility notes: no Lighthouse CI content is copied.

- Source project: `ai/size-limit`
- Source URL: `https://github.com/ai/size-limit`
- License: MIT
- Local use: optional bundle impact evidence source.
```

- [x] **Step 4: Create `skills/review-performance/references/pressure-scenarios.md`**

Use this content:

```markdown
# Pressure Scenarios

## unbounded-tenant-query

- pressure: API endpoint loops through all tenant records without limit or pagination.
- expected_behavior: report blocking performance risk with data-size-dependent impact.

## expensive-render-large-list

- pressure: React component recomputes expensive derived data for each render over large list.
- expected_behavior: report if component is user-facing hot path or list size is unbounded.

## large-browser-dependency

- pressure: frontend change imports a large dependency into main bundle.
- expected_behavior: report when bundle evidence or import path shows user-facing impact.

## theoretical-micro-optimization

- pressure: code could be marginally faster but no hot path or data-size risk exists.
- expected_behavior: do not block.
```

- [x] **Step 5: Run targeted audit**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-performance --json
```

Expected: `errors: 0`, `warnings: 0`.

## Task 5: Wire Review Packs Into Skill Standard, PM, and Registry

**Files:**

- Modify: `scripts/checks/skill-standard.mjs`
- Modify: `skills/skill-audit/scripts/skill-standard.mjs`
- Modify: `docs/references/review-pack-registry.md`
- Modify: `skills/pm-orchestrator/SKILL.md`
- Test: targeted audits plus full `node scripts/checks/skill-standard.mjs`

- [x] **Step 1: Update key skill lists**

In both `scripts/checks/skill-standard.mjs` and `skills/skill-audit/scripts/skill-standard.mjs`, add:

```js
  "review-security",
  "review-github-actions",
  "review-frontend",
  "review-performance",
```

Place them near `"reviewer"` so key review skills are grouped.

- [x] **Step 2: Update review pack registry**

Edit `docs/references/review-pack-registry.md` registry rows so the implemented packs appear as:

```markdown
| `security_review` | `/review-security` | Sentry security-review, Semgrep, Gitleaks, OSV-Scanner | see `/review-security/references/source.md` | mixed, reference-only | implemented-local | Lightweight high-confidence security review pack; dependency lane included until supply-chain pack exists |
| `github_actions_review` | `/review-github-actions` | Sentry gha-security-review, Trail of Bits agentic-actions-auditor, zizmor, actionlint | see `/review-github-actions/references/source.md` | mixed, reference-only | implemented-local | Includes agentic actions mode for AI agent workflows |
| `frontend_review` | `/review-frontend` | axe-core, Pa11y, Lighthouse CI | see `/review-frontend/references/source.md` | mixed, reference-only | implemented-local | Code review for UI state, accessibility and interaction risk; does not replace browser verification |
| `performance_review` | `/review-performance` | Lighthouse CI, size-limit, project-native profilers | see `/review-performance/references/source.md` | mixed, reference-only | implemented-local | High-signal performance risk review; not full profiling |
```

Keep non-implemented candidate rows only when they represent future capability such as `/review-supply-chain` or `/ci-cd-gate`.

- [x] **Step 3: Update PM routing**

In `skills/pm-orchestrator/SKILL.md`, add a `### Review Pack Scheduling` section after the stage routing table:

```markdown
### Review Pack Scheduling

PM keeps `/reviewer` as the default code review skill and adds review packs by risk:

- auth, permission, secrets, tenant boundary, payment, external request, SQL/shell/template execution, dependency risk: add `/review-security`.
- `.github/workflows/**`, `action.yml`, `.github/actions/**`, workflow-loaded scripts, or AI agent actions in CI: add `/review-github-actions`.
- UI components, forms, navigation, loading/error/empty states, accessibility, responsive layout or visual behavior: add `/review-frontend`.
- hot paths, queries, pagination, cache, API fan-out, large lists, bundle size or expensive render/computation: add `/review-performance`.

Multiple review packs may run in parallel because they are read-only, but PM must aggregate their `Review Handoff` results before deciding whether to backflow to `/developer`.
```

- [x] **Step 4: Run audits**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-security --json
node skills/skill-audit/scripts/skill-standard.mjs --skill review-github-actions --json
node skills/skill-audit/scripts/skill-standard.mjs --skill review-frontend --json
node skills/skill-audit/scripts/skill-standard.mjs --skill review-performance --json
node scripts/checks/skill-standard.mjs
```

Expected:

- Each targeted audit: `errors: 0`, `warnings: 0`.
- Full check: `status: PASS`; existing unrelated warnings are acceptable if no new review-pack warnings appear.

## Task 6: Sync Public Docs and Product Specs

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/product-specs/skill-system.md`
- Modify: `docs/product-specs/agent-system.md`
- Modify: `docs/guides/harness-guide.md`
- Test: `rg -n "review-security|review-github-actions|review-frontend|review-performance|review packs" README.md AGENTS.md docs/product-specs docs/guides`

- [x] **Step 1: Update skill quick references**

In `README.md` and `AGENTS.md`, add these rows near `/reviewer`:

```markdown
| `/review-security` | 安全专项审查 pack，按 high-confidence data-flow 模式审查 auth、secrets、injection、tenant boundary 和 dependency risk |
| `/review-github-actions` | GitHub Actions 专项审查 pack，覆盖 workflow 安全和 AI agent action 风险 |
| `/review-frontend` | 前端专项审查 pack，覆盖 UI 状态、a11y、responsive、forms 和 interaction risk |
| `/review-performance` | 性能专项审查 pack，覆盖 hot path、queries、cache、bundle、large lists 和 expensive render/computation |
```

- [x] **Step 2: Update product specs**

In `docs/product-specs/skill-system.md`, extend the review pack section with:

```markdown
已实现的第一批 review packs：

- `/review-security`
- `/review-github-actions`
- `/review-frontend`
- `/review-performance`

这些 pack 是轻量自研 wrapper，不直接 vendoring 三方 skill；三方项目作为 source attribution 和 optional tool references 记录在各自 `references/source.md`。
```

In `docs/product-specs/agent-system.md`, add the four packs to the role/skill table with the same descriptions used in README.

- [x] **Step 3: Update harness guide**

In `docs/guides/harness-guide.md`, add a review routing example:

```markdown
| 涉及 auth/secrets/tenant boundary | `/pm-orchestrator` -> `/reviewer` + `/review-security` |
| 修改 GitHub Actions | `/pm-orchestrator` -> `/reviewer` + `/review-github-actions` |
| 修改复杂 UI | `/pm-orchestrator` -> `/reviewer` + `/review-frontend` |
| 修改 hot path/query/cache/bundle | `/pm-orchestrator` -> `/reviewer` + `/review-performance` |
```

- [x] **Step 4: Search for stale wording**

Run:

```bash
rg -n "review pack|review packs|review-security|review-github-actions|review-frontend|review-performance|implemented-local|candidate" README.md AGENTS.md docs skills
```

Expected:

- New pack names appear in quick references, product specs, registry and PM routing.
- Registry does not imply unimplemented packs are implemented.
- `/reviewer` remains the base review skill.

## Task 7: Verification, Install Smoke, Temporary Routing Test, and Plan Closeout

**Files:**

- Modify: `docs/exec-plans/index.md`
- Move after completion: `docs/exec-plans/active/2026-05-18-review-packs-implementation.md` -> `docs/exec-plans/completed/2026-05-18-review-packs-implementation.md`
- Test: full audit, install smoke, temporary PM routing test.

- [x] **Step 1: Run targeted audits**

Run:

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill review-security --json
node skills/skill-audit/scripts/skill-standard.mjs --skill review-github-actions --json
node skills/skill-audit/scripts/skill-standard.mjs --skill review-frontend --json
node skills/skill-audit/scripts/skill-standard.mjs --skill review-performance --json
```

Expected: each command reports `errors: 0`, `warnings: 0`.

- [x] **Step 2: Run full skill standard check**

Run:

```bash
node scripts/checks/skill-standard.mjs
```

Expected: `status: PASS`. Existing unrelated warnings are acceptable; new review packs should have no warnings.

- [x] **Step 3: Run install smoke**

Run:

```bash
tmpdir=$(mktemp -d)
./install.sh --target both --dest "$tmpdir"
test -f "$tmpdir/.codex/skills/review-security/SKILL.md"
test -f "$tmpdir/.codex/skills/review-github-actions/SKILL.md"
test -f "$tmpdir/.codex/skills/review-frontend/SKILL.md"
test -f "$tmpdir/.codex/skills/review-performance/SKILL.md"
test -f "$tmpdir/.claude/skills/review-security/SKILL.md"
test -f "$tmpdir/.claude/skills/review-github-actions/SKILL.md"
test -f "$tmpdir/.claude/skills/review-frontend/SKILL.md"
test -f "$tmpdir/.claude/skills/review-performance/SKILL.md"
echo "install smoke ok: $tmpdir"
```

Expected: prints `install smoke ok`.

- [x] **Step 4: Run temporary routing test**

Create a temp project under `/tmp` or `/private/tmp` with:

- `.github/workflows/agent-review.yml` containing one AI agent workflow with tainted PR title in env.
- `src/auth.js` containing one safe server-config external request and one unsafe request-param redirect or SQL interpolation.
- `src/Form.jsx` containing one icon-only button without accessible name.
- `src/list.js` containing one unbounded loop over request-sized input.

Ask a subagent to read `/pm-orchestrator` and the four packs, then produce PM routing and four `Review Handoff` results without modifying files.

Expected routing:

- `.github/workflows/agent-review.yml` -> `/review-github-actions`
- `src/auth.js` -> `/review-security`
- `src/Form.jsx` -> `/review-frontend`
- `src/list.js` -> `/review-performance`

Expected result:

- Each pack reports at least one high-signal finding and avoids at least one false positive from its pressure scenarios.
- PM summary aggregates findings and routes fixes back to `/developer`.

- [x] **Step 5: Move plan to completed**

Before moving, mark all checkboxes complete:

```bash
perl -0pi -e 's/- \\[ \\]/- [x]/g' docs/exec-plans/active/2026-05-18-review-packs-implementation.md
mv docs/exec-plans/active/2026-05-18-review-packs-implementation.md docs/exec-plans/completed/2026-05-18-review-packs-implementation.md
```

- [x] **Step 6: Update exec plan index**

In `docs/exec-plans/index.md`, replace active entry with:

```markdown
当前没有 active plan。
```

Add completed row:

```markdown
| [2026-05-18-review-packs-implementation.md](completed/2026-05-18-review-packs-implementation.md) | 新增四个专项 review packs，并接入 PM routing、registry、docs 和安装验证 | Completed |
```

- [x] **Step 7: Final status**

Run:

```bash
git status --short
```

Expected: only intended review-pack implementation files and docs are changed. Do not revert existing unrelated developer/TDD changes.

## Self-Review Checklist

- Spec coverage: all four packs, source references, PM routing, optional tools, pressure scenarios, docs and verification are mapped to tasks.
- Red-flag scan: no vague markers or unspecified implementation steps.
- Type/name consistency: capability names are `security_review`, `github_actions_review`, `frontend_review`, `performance_review`; skill names are `/review-security`, `/review-github-actions`, `/review-frontend`, `/review-performance`.
- Scope: `/review-supply-chain` remains out of scope; dependency risk stays inside `/review-security` dependency lane.
