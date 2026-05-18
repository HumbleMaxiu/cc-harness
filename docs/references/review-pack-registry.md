# Review Pack Registry

> 本 registry 记录可被 PM orchestrator 按 capability 调度的专项 review / verification pack。它不是“已实现能力列表”；`Status` 明确区分 candidate、planned、implemented。

## Capability Contract

Review pack 是一种特殊 skill：

- 按 capability 被调度，而不是按三方项目名被调度。
- 主要用于 review、test、CI/CD、security、quality gate 等阶段。
- 必须输出 `Review Handoff` 或 `Verification Handoff`。
- 如果来自三方项目，必须符合 [skill-standard.md](skill-standard.md) 和 [third-party-skill-integration.md](../design-docs/third-party-skill-integration.md)。
- 关键 review pack 必须补本地 pressure scenario，证明它能改变 agent 的 review 行为。

## Registry

| Capability | Local Skill | Source Project | Source Path | License | Status | Notes |
|------------|-------------|----------------|-------------|---------|--------|-------|
| `security_review` | `/review-security` | Sentry security-review, Semgrep, Gitleaks, OSV-Scanner | see `/review-security/references/source.md` | mixed, reference-only | implemented-local | Lightweight high-confidence security review pack; dependency lane included until supply-chain pack exists |
| `github_actions_review` | `/review-github-actions` | Sentry gha-security-review, Trail of Bits agentic-actions-auditor, zizmor, actionlint | see `/review-github-actions/references/source.md` | mixed, reference-only | implemented-local | Includes agentic actions mode for AI agent workflows |
| `frontend_review` | `/review-frontend` | axe-core, Pa11y, Lighthouse CI, Playwright | see `/review-frontend/references/source.md` | mixed, reference-only | implemented-local | Code review for UI state, accessibility and interaction risk; consumes but does not create browser evidence |
| `performance_review` | `/review-performance` | Lighthouse CI, size-limit, webpack bundle analyzer, project-native profilers | see `/review-performance/references/source.md` | mixed, reference-only | implemented-local | High-signal performance risk review; not full profiling |
| `supply_chain_audit` | `/review-supply-chain` | Trail of Bits skills | `plugins/supply-chain-risk-auditor` | CC-BY-SA-4.0 | candidate | 只登记候选；需明确 package manager 覆盖范围和 false positive 处理 |
| `ui_verification` | `/ui-verify` | OpenAI bundled / Playwright-like skills | browser / webapp testing skills | varies | planned | 当前仓库可自研 wrapper，输出 Verification Handoff；三方来源待单独调研 |
| `ci_cd_triage` | `/ci-cd-gate` | GitHub skills / Sentry iterate-pr | GitHub CI triage / `skills/iterate-pr` | Apache-2.0 for Sentry | candidate | 需要和现有 `/harness-quality-gate`、PM orchestrator failure routing 对齐 |
| `skill_quality_review` | `/skill-audit` | Trail of Bits skills | `plugins/skill-improver`、`plugins/workflow-skill-design` | CC-BY-SA-4.0 | implemented-local | 不直接复制；吸收 severity、workflow design 和 anti-pattern 思路到本地标准，作为用户和 PM gate 可调度入口 |

## Import Requirements

当某个 candidate 落地为 `skills/<local-name>/`：

- MUST 创建 `references/source.md`。
- MUST 在 `SKILL.md` 写 `## Source`。
- MUST 记录 imported commit / tag。
- MUST 适配 cc-harness output contract。
- MUST 补 pressure scenario 或写明豁免原因。
- MUST 通过 `node scripts/checks/skill-standard.mjs`。

## PM Orchestrator Scheduling

PM orchestrator SHOULD 按任务风险选择 review pack：

- 涉及 auth、permissions、secrets、payments、tenant boundary：调度 `security_review`。
- 修改 `.github/workflows/` 或 AI agent CI：调度 `github_actions_review`。
- 修改 dependencies、lockfile、package manager config：优先调度 `security_review` dependency lane；未来可拆到 `supply_chain_audit`。
- 修改 UI、visual behavior、responsive layout：调度 `frontend_review`；需要真实浏览器验收时，只有在 `/ui-verify` implemented 后才调度 `ui_verification`，否则记录 `needs_verification`。
- 修改 hot path、query、cache、bundle、large list 或 expensive render/computation：调度 `performance_review`。
- CI/CD 失败或发布 gate 前：`ci_cd_triage` 仍是 future capability；在 `/ci-cd-gate` implemented 前不要把它当作当前 review pack 调度。

本 registry 现在包含第一批 implemented-local review packs；candidate rows 表示未来可拆出的能力。
