# 三方 Skill 引入设计

## 背景

`cc-harness` 的终局目标不是把所有能力都从零实现，而是站在 GitHub 开源生态和成熟工程实践之上，整合出符合本项目要求的 docs-first harness。

因此，专项能力类 skill 可以优先复用或改编三方实现，例如 security review、GitHub Actions review、supply-chain audit、Playwright UI testing、CI/CD triage。与此同时，`cc-harness` 的核心编排、docs/memory 收口、Codex compatibility 和 quality gate 必须保持自有标准。

## 设计目标

- 允许把三方 skill 直接引入 `skills/`，不新增 `vendor-skills/` 目录
- 三方 skill 必须先满足 [cc-harness Skill Standard](../references/skill-standard.md)
- 每个三方来源 skill 必须记录 source attribution、license、imported commit 和 local changes
- 三方 skill 必须适配 cc-harness output contract，能被 `/pm-orchestrator` 和 `/harness-quality-gate` 消费
- PM orchestrator 依赖 capability，而不是依赖某个固定三方项目
- 三方 skill 不得绕开 `docs/`、Run Trace、feedback memory 和 quality gate

## 非目标

- 不建立独立 marketplace
- 不把三方 repo 原样镜像到本仓库
- 不引入 license 不清晰或不允许再分发 / 改编的内容
- 不让三方 skill 定义新的事实源或新的执行状态体系

## 目录策略

所有可用 skill 都放在 `skills/` 下：

```text
skills/
  review-security/
    SKILL.md
    references/source.md
  review-github-actions/
    SKILL.md
    references/source.md
  ui-verify/
    SKILL.md
    references/source.md
```

这样安装器仍只需要复制 `skills/`，用户在 Codex / Claude Code 中看到的也是统一 skill 列表。

## 标准关系

三方 skill 的通用结构、frontmatter、required sections、output contract、pressure scenarios 和 audit severity 以 [cc-harness Skill Standard](../references/skill-standard.md) 为事实源。

本文只补充三方来源特有的 import policy：

- source attribution
- license / redistribution decision
- imported commit / tag
- local changes
- wrapper / compatibility notes
- review pack registry 状态

调研依据见 [Skill Standard Research](../references/skill-standard-research.md)。专项 review pack 候选见 [Review Pack Registry](../references/review-pack-registry.md)。

## Source Attribution

任何三方来源 skill 必须包含 `references/source.md`。如果是完全自研 skill，可以省略。

推荐格式：

```markdown
# Source Attribution

- Source project:
- Source skill/path:
- Source URL:
- License:
- Imported commit:
- Import date:
- Local skill name:
- Local changes:
- Compatibility notes:
```

`SKILL.md` 中也应有一个短的 `## Source` section，链接到 `references/source.md`。

## 引入准入条件

引入前必须确认：

1. **License 可用**：允许本仓库使用、修改、再分发；不清楚时只记录为候选，不复制内容。
2. **来源可追溯**：有固定 URL 和 commit / tag。
3. **能力边界清晰**：skill 解决一个明确 capability，不是大而全 agent。
4. **可适配输出**：能输出 cc-harness handoff / report，而不是只给自由文本建议。
5. **不破坏事实源**：不创建平行 memory、plan 或 workflow 状态。
6. **Codex 可用**：不硬依赖 Claude-only hook、slash command 或 UI。

## 适配要求

三方 skill 进入 `skills/` 后，必须先符合 [cc-harness Skill Standard](../references/skill-standard.md)，并额外补齐 source attribution。

最低要求：

- YAML frontmatter：`name`、`description`
- 何时使用 / 何时不要使用
- 输入 / 读取项
- 执行流程
- 输出格式
- 暂停 / 阻塞条件
- `## Source` 链接到 `references/source.md`
- 关键 review pack 的 pressure scenario 或豁免说明

专项 review skill 的输出建议统一为：

```markdown
### Review Handoff
- capability:
- source_skill:
- files_reviewed:
- findings:
- risk_level:
- operation_risk:
- required_fixes:
- optional_suggestions:
- evidence:
- status: APPROVED / REJECTED / BLOCKED
```

CI/CD 或 testing skill 的输出建议统一为：

```markdown
### Verification Handoff
- capability:
- source_skill:
- commands_or_checks:
- passed:
- failed:
- logs_or_links:
- required_fixes:
- retry_policy:
- status: APPROVED / REJECTED / BLOCKED
```

## PM Orchestrator 调用方式

`/pm-orchestrator` 不直接绑定某个三方项目，而是按 capability 调用：

| Capability | 本地入口 | 可复用来源示例 |
|------------|----------|----------------|
| `security_review` | `/review-security` | Trail of Bits security skills |
| `github_actions_review` | `/review-github-actions` | Trail of Bits / Sentry GitHub workflow skills |
| `supply_chain_audit` | `/review-supply-chain` | Trail of Bits supply-chain skills |
| `ui_verification` | `/ui-verify` | Playwright skill / UAT skills |
| `ci_cd_triage` | `/ci-cd-gate` | GitHub Actions triage skills |

本地入口可以是三方改编，也可以是自研 wrapper。PM orchestrator 只关心 capability 的输入输出契约。

首批候选和 license 状态不在本文重复维护，统一记录在 [Review Pack Registry](../references/review-pack-registry.md)。

## Skill Audit 要求

`scripts/checks/skill-standard.mjs` 是第一版手动检查入口。它的通用规则来自 [cc-harness Skill Standard](../references/skill-standard.md)。

缺少 source attribution 的三方 skill 应 audit fail。License 不清楚时不能复制内容，只能在 registry 中登记为 candidate。

## 决策

采用统一 `skills/` 目录，不新增 `vendor-skills/`。三方 skill 可以直接作为本地 skill 存放，但必须记录来源并适配 cc-harness contract。

这让用户看到的是一组统一可用的 skills，同时保留 license、来源和后续维护边界。
