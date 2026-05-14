# Skill Standard Research

> 本文记录 `cc-harness Skill Standard` 的外部依据和本地取舍。后续修改 `docs/references/skill-standard.md`、`/skill-creator`、`scripts/checks/skill-standard.mjs`、review pack registry 时，应优先追溯到本文。

## Objective

为 `cc-harness` 建立一套有依据的 Skill 标准，而不是只靠本地偏好。标准需要同时满足：

- 兼容 Agent Skills open format
- 支持 Codex / Claude Code runtime projection
- 服务 docs-first harness、PM orchestration、review / test handoff
- 支持三方 skill 直接进入 `skills/` 并保留 source attribution
- 支持未来从 feedback / recurrence 生成 skill 时进行行为验证

## Sources

| Source | URL | License | Relevant paths |
|--------|-----|---------|----------------|
| Open Agent Skills specification | https://openagentskills.dev/docs/specification | Site docs, format reference | `SKILL.md` frontmatter、`scripts/`、`references/`、`assets/`、progressive disclosure |
| Agent Skills overview | https://agentskills.io/home | Site docs, ecosystem reference | open format、discovery / activation / execution model |
| Anthropic skills | https://github.com/anthropics/skills | Apache-2.0 for many examples; document skills include source-available caveat | `README.md`、`spec/`、`template/`、example skills |
| Supabase agent-skills | https://github.com/supabase/agent-skills | MIT | `AGENTS.md`、`package.json`、`skills/*/SKILL.md`、release/test workflow |
| Sentry skills | https://github.com/getsentry/skills | Apache-2.0 | repo-root `skills/`、`agents/`、`AGENTS.md`、`skills/skill-writer/SKILL.md` |
| Superpowers | https://github.com/obra/superpowers | MIT | `skills/writing-skills/SKILL.md`、`testing-skills-with-subagents.md`、development workflow |
| Trail of Bits skills | https://github.com/trailofbits/skills | CC-BY-SA-4.0 | `plugins/workflow-skill-design/`、`plugins/skill-improver/`、review / security packs |

## Open Agent Skills / Anthropic Baseline

可直接采用：

- 一个 skill 是一个目录，至少包含 `SKILL.md`。
- `SKILL.md` 必须包含 YAML frontmatter 和 Markdown body。
- `name` 与 `description` 是必需字段，`name` 需要匹配目录名。
- `description` 不只是摘要，而是 activation 触发依据，需要同时说明能力和使用场景。
- `scripts/`、`references/`、`assets/` 是通用可选目录。
- Progressive disclosure 是结构原则：启动时只加载 metadata，命中后加载 `SKILL.md`，需要时再加载 references / scripts / assets。
- `SKILL.md` 不宜变成百科，长背景应拆到一跳可达的 reference file。

本地适配：

- `cc-harness` 使用 `skills/` 作为仓库事实源，安装脚本投放到 Codex / Claude Code host。
- 本地标准允许 `metadata` / `compatibility` 等可选字段，但第一版检查只强制 `name` / `description`。
- 因为仓库已明确不保存 `.codex/`、`.claude/`、`.claude-plugin/`，任何 host-specific 文件都必须由 installer 生成。

暂不采用：

- 不采用 provider-only frontmatter 作为必需字段，例如 Claude-only tool whitelist。原因：项目需要同时支持 Codex / Claude Code。
- 不把 `.skill` packaging 作为当前仓库必需流程。原因：当前分发路径是 `install.sh` / `scripts/install.mjs`。

## Supabase Agent Skills

可直接采用：

- `skills/{skill-name}/SKILL.md` 的简洁目录约束。
- `name` 使用 lowercase alphanumeric + hyphen，长度受限，必须匹配目录名。
- `description` 必须说明 “what it does AND when to use it”。
- 对 shipped skill 变更要运行测试，并通过 release / version discipline 保护分发质量。

本地适配：

- 当前 `cc-harness` 没有 release-please skill package pipeline，因此先把 release discipline 转成 `scripts/checks/skill-standard.mjs` 和手动验证入口。
- 未来若加入 marketplace / release assets，再考虑自动 version bump。

暂不采用：

- 不在本计划内复制 Supabase 的 package / release 流程。原因：当前目标是标准、审计和三方引入边界，不是 registry 发布。

## Sentry Skills

可直接采用：

- repo-root `skills/` 作为 canonical source，agent / plugin projection 只是宿主适配层。
- `AGENTS.md` 作为工程团队进入仓库后的导航和协作规则。
- skill-writer 模式把 source capture、mode selection、output contract、registration validation 拆成 reference-backed workflow。
- 重要 skill 变更需要有维护契约或 spec 说明，避免一次性文档漂移。

本地适配：

- `cc-harness` 已经把 `skills/` 作为唯一 source，将 host projection 留给 installer。
- 不恢复 `agents/` 目录；角色能力已经转成 role skills。
- 不强制每个 skill 都有 `SPEC.md`。本地先要求关键 workflow / 三方来源 / feedback-generated skill 有 pressure scenario 或明确豁免。

暂不采用：

- 不把 Sentry 的 `agents/` 结构重新引入仓库。原因：用户已要求删除并转换 agent 定义为 skill。

## Superpowers

可直接采用：

- 把 skill creation 视为 “process documentation 的 TDD”。
- 重要 skill 应先记录 pressure scenario：没有 skill 时 agent 会怎样失败、怎样 rationalize。
- RED / GREEN / REFACTOR 可作为 skill 行为验证循环：先记录失败，再写规则，再压测并收紧 loophole。
- 不为一次性解决方案创建 skill；重复、跨项目、有判断成本的流程才适合 skill。

本地适配：

- 第一版不直接引入 Superpowers skill，而是吸收其 pressure scenario 方法到 `docs/references/skill-pressure-scenarios.md`。
- `feedback` / recurrence 生成 skill 时，必须先抽象至少一个 pressure scenario，避免把一次性需求变成长期规则。
- 检查脚本第一版只 warning 缺失 pressure scenario，不强制所有现有 skill 立即通过。

暂不采用：

- 不直接安装 Superpowers 全套 workflow。原因：`cc-harness` 已有自有 `/pm-orchestrator`、docs-first memory、installer 和 role skill 体系，直接引入会产生平行流程。

## Trail of Bits Skills

可直接采用：

- Workflow skill design 关注 activation description、numbered phases、entry / exit criteria、progressive disclosure、reference chain、verification step。
- Skill improver 模式把问题分为 critical / major / minor，并通过 review -> categorize -> fix -> evaluate -> repeat 的循环收敛。
- Review packs 是按 capability 分发的专项审查能力，例如 GitHub Actions security、supply-chain、static analysis、property-based testing。
- Audit / review skill 中显式列出 “Rationalizations to Reject” 可以减少 agent 漏报。

本地适配：

- `review-pack-registry.md` 只记录 capability、候选来源、license、状态和 wrapper 需求；本计划不复制三方 skill。
- Trail of Bits license 是 CC-BY-SA-4.0。复制或改编内容前需要 license 决策；第一阶段只做候选登记和本地 wrapper 设计。
- 审查类 skill 的输出必须适配 `Review Handoff` / `Verification Handoff`，方便 PM orchestrator 消费。

暂不采用：

- 不直接复制 Trail of Bits review packs。原因：license 与输出 contract 都需要进一步评估。
- 不采用 Claude-only tool semantics 作为本地标准必需项。原因：Codex compatibility 是本项目核心目标之一。

## Local cc-harness Requirements

以下规则主要来自本项目愿景和已有架构，而不是外部标准：

- Docs-first：skill 必须说明需要读取或维护哪些 docs，或明确不需要。
- Workflow stage：skill 应说明属于 vibe coding、AI coding、review、test、PM orchestration、maintenance 中哪个阶段。
- Output contract：workflow / review / test 类 skill 必须输出可被 `/pm-orchestrator`、`/harness-quality-gate` 或相关 review / verification gate 消费的结构。
- Feedback / memory boundary：skill 不得把 task-local 实现说明、测试同步、一次性 UI 指令误写入长期 memory。
- Codex compatibility：skill 不得默认只有 Claude Code 可用；需要 host-specific 分支时必须写明。
- Third-party source attribution：三方来源 skill 必须有 `references/source.md`，记录 source project、URL、license、commit、local changes。
- Installable runtime portability：安装/分发/跨项目复用的 skill 必须内置运行必需 references / scripts / assets；repo-level docs/scripts 只能作为 supplemental source。

## Decisions

- `docs/references/skill-standard.md` 采用 Agent Skills open format 作为 baseline。
- `docs/references/skill-pressure-scenarios.md` 采用 Superpowers 的 behavior testing 思路，但改成本项目轻量格式。
- `scripts/checks/skill-standard.mjs` 采用 Supabase / Open Agent Skills 的 frontmatter 约束，加上 cc-harness warning 规则。
- `/skill-creator` 继续承担 create / improve；`/skill-audit` 独立承担用户和 PM gate 可调度的 audit 入口。
- Review packs 先做 registry 和接入规范，不把候选误写成已实现能力。
- 三方 skill 可以直接进入 `skills/`，但必须补齐 source attribution、output contract、Codex compatibility 和 pressure scenario。
