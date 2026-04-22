# Per-file specs for OpenAI-style harness

填充目标仓库时使用。根据**项目类型**调整名称（例如 `api-schema.md` vs `db-schema.md`）。

## Root

### `AGENTS.md`

- **Purpose：** Operator + agent 契约；**地图**进入 `docs/`。
- **Length：** 目标约 100 行；**硬上限 120 行**。超过 120 行是质量缺陷。
- **Include：** 项目一句话描述；优先级顺序（user > harness docs > defaults）；技术栈表；仓库布局表；secrets/logging 规则；测试门槛；链接到 `ARCHITECTURE.md` 和关键 `docs/` 文件。
- **Include：** 如果仓库启用了记忆机制，在 docs 导航中加入 `docs/memory/index.md`。
- **Include：** 如果仓库启用了 workflow / 文档维护能力，在 Skill 快速参考中给出 `/doc-sync`，说明它用于代码或流程变更后的文档同步。
- **Include：** 如果仓库启用了产品级根入口，在 Skill 快速参考中给出 `/harness-help`、`/harness-audit`、`/harness-guide`、`/harness-quality-gate`。
- **Include — How to use this harness：** 一个短的 `## How to use this harness` section，最多**3 行**，并链接到 `docs/PLANS.md` 获取扩展工作流：

| Scenario | Start here | Then |
| -------- | ---------- | ---- |
| New feature | `docs/product-specs/<domain>.md` | 在 `docs/exec-plans/active/` 创建计划 → 实现 → 移动到 `completed/` |
| Bug fix | `docs/RELIABILITY.md` + `docs/SECURITY.md` | 修复 → 更新 `docs/QUALITY_SCORE.md` |
| Architecture change | `ARCHITECTURE.md` | 添加 `docs/design-docs/<name>.md` → 从 index 链接 → 实现 |

本节末尾：`For tech debt, doc maintenance, and other workflows see [docs/PLANS.md](docs/PLANS.md).`。不要添加更多行；将额外工作流推到 `docs/PLANS.md`。

- **Avoid：** 长教程；重复 `product-specs/`；粘贴 API 列表 — **链接**代替。

**Update rules（harness update 模式）：** 添加 domain 时，如需要则在 Quick nav / Deep dives 表追加一行；添加新的 `docs/product-specs/<domain>.md` 并更新 `docs/product-specs/index.md`。不要删除不相关的 sections。

**Scaffold rule：** 如果 scaffold 输出里已经包含 `/dev-workflow`、review/test workflow 或文档同步规则，则默认也要暴露 `/doc-sync`，避免“要求同步文档”但没有明确入口。

### `ARCHITECTURE.md`

- **Purpose：** 对人类和 agents 的顶层**技术地图**。
- **Include：** ASCII 或文本图（services、data flow）；模块/包边界；如果是分层架构则包括依赖方向；链接到 `docs/DESIGN.md`、`docs/SECURITY.md`、`docs/design-docs/`。
- **Avoid：** 完整的 endpoint 目录 — 放到 `docs/product-specs/` 或 `docs/generated/`。
- **Relationship：** 项目级长期地图；不替代 `docs/design-docs/*.md` 的具体设计细节。
- **Scaffold mode：** 只生成结构骨架、模块占位和“如何迭代补全”的说明，不要在初始化时假装架构已经成熟。
- **Promote from：** `docs/design-docs/*.md`、真实目录结构、已稳定的模块边界。

## `docs/` top-level

### `docs/DESIGN.md`

- **Purpose：** 简短设计**理念**（5–15 行）。
- **Include：** 系统优化目标；链接到 `design-docs/index.md`。
- **Relationship：** 项目级原则文档，不替代具体 design doc。
- **Scaffold rule：** 如果用户没有给出足够项目背景，写最小原则和明确假设，不编造细节。
- **Promote from：** 多个 `docs/design-docs/*.md` 中反复出现的稳定原则。

### `docs/PLANS.md`

- **Purpose：** **路线图**阶段（产品），区别于 task 级 exec plans。也是**扩展工作流指导**的归宿，这些内容不适合放在 `AGENTS.md` 的 3 行使用表中（tech debt 分类、文档新鲜度维护等）。
- **Include：** Phase 1 = harness/scaffold 完成；后续阶段为要点；链接到 `exec-plans/`。包含一个 **Workflows** section 用于 tech debt、文档新鲜度和任何项目特定例程。
- **Relationship：** 项目级路线图/导航，不替代 `docs/exec-plans/*.md` 的具体任务计划。
- **Scaffold rule：** 默认生成“工作流导航 + 路线图占位”。如果没有足够用户输入，不要随机编造 roadmap；使用 `TBD`、明确假设或“待用户确认”。
- **Approval rule：** `PLANS.md` 在用户审查通过前只能视为 scaffold 草稿，不应被当作产品真实路线图。
- **Promote from：** `docs/exec-plans/completed/*.md`、用户明确给出的中长期目标、稳定 workflow 约定。

### `docs/PRODUCT_SENSE.md`

- **Purpose：** 产品为**谁**服务，**什么**是"好"。
- **Include：** 3–7 个要点（personas、non-goals、UX 原则）。
- **Relationship：** 项目级产品判断标准，不替代某个 domain spec。
- **Scaffold rule：** 缺少明确产品输入时，只生成保守的占位结构和待确认项。
- **Promote from：** 用户明确需求、`docs/product-specs/*.md` 的共性、已确认的非目标。

### `docs/QUALITY_SCORE.md`

- **Purpose：** 质量维度的**记分卡**。
- **Include：** 表格 — criterion | target | notes（typecheck、tests、docs 新鲜度、覆盖率 if used）。
- **Include：** 一段 `Harness Audit 映射`，把质量维度对应到 repo-local checks 和文档信号。
- **Refresh rules（harness update）：** 每个条目必须引用**具体仓库信号**（例如 `jest.config.ts` 存在、`pyproject.toml` 中有 `pytest`、CI workflow 名称）。如果某个标准没有找到信号，写 **TBD** — 不要编造数字或百分比。

### `docs/RELIABILITY.md`

- **Purpose：** 运行时**可靠性**预期。
- **Include：** 超时、重试（仅幂等）、幂等性说明、observability hooks（如果有）。
- **Relationship：** 项目级可靠性原则；具体故障修复仍应进入 exec plan 或设计文档。
- **Scaffold mode：** 生成恢复/幂等性模板，不要凭空捏造具体 SLA 或运行约束。
- **Promote from：** bugfix exec plans、测试入口、已确认的故障处理经验。

### `docs/SECURITY.md`

- **Purpose：** **Secrets、auth、audit** 预期。
- **Include：** token 放在哪里；永不 log secrets；威胁相关约定；链接到 product specs 中的 auth flows。
- **Relationship：** 项目级安全基线；具体漏洞修复仍应进入 task 级文档。
- **Scaffold mode：** 生成安全基线模板，不要凭空捏造真实 auth 架构或 secrets 流。
- **Promote from：** reviewer 反馈、已存在的部署/认证配置、已确认的合规要求。

### `docs/memory/index.md`

- **Purpose：** 工作记忆和反馈的入口索引。
- **Include：** 读取顺序；`docs/memory/feedback/` 的三类文档链接；“`docs/memory/` 是事实来源”的说明。

### `docs/FRONTEND.md`（可选）

- **Include when：** frontend 或 fullstack。纯 backend/CLI/library 如果不适用则省略。
- **Include：** UI 约定、a11y 门槛、routing/state、链接到 design system references。
- **Relationship：** 项目级前端基线；具体页面/交互设计进入 `design-docs/`。
- **Scaffold mode：** 只生成前端约定骨架；不要在没有 UI 事实时伪造设计系统结论。
- **Promote from：** UI design docs、组件实现、已确认的前端规范。

## `docs/design-docs/`

### `docs/design-docs/index.md`

- **Purpose：** design docs 的**目录**。
- **Include：** 表格 — document | description | optional status。

**Update rules：** 添加 design docs 时追加行；从本 index 链接新文件。

### `docs/design-docs/core-beliefs.md`

- **Purpose：** 编号的工程原则（agent-first）。
- **Include：** 5–8 个要点 — naming、errors、testing、边界等。

### Additional design docs（可选）

- 例如 `cli-command-design.md`、`api-conventions.md` — 每个 concern 一个文件；从 index 链接。

## `docs/exec-plans/`

### `docs/exec-plans/active/` 和 `docs/exec-plans/completed/`

- **Purpose：** 作为 git artifact 的**执行计划**。空目录使用 `.gitkeep`。
- **Convention：** 每个计划一个 markdown 文件；完成后从 `active` 移动到 `completed`。

### `docs/exec-plans/tech-debt-tracker.md`

- **Purpose：** 带 owner/area 说明的**tech debt** 运行列表。
- **Include：** 表格 — item | area | notes | optional priority。

## `docs/generated/`

### `docs/generated/db-schema.md` 或 `docs/generated/api-schema.md`

- **Purpose：** 生成 artifact 的**占位符**。
- **Include：** 如何重新生成（命令/脚本）；"请勿手写编辑"警告。

## `docs/product-specs/`

### `docs/product-specs/index.md`

- **Purpose：** **domain** specs 的目录。
- **Include：** 表格链接每个 `*.md` 并附一行描述。

**Update rules：** 为新 domains 追加行；只有在用户确认后才能删除 domain 文件时移除行。

### `docs/product-specs/<domain>.md`

- **Purpose：** 一个**产品 domain** 的行为。
- **Include：** 目标、用户可见行为、API/CLI 接触点、edge cases；链接到 references。

## `docs/references/`

### `docs/references/<topic>-llms.txt`

- **Purpose：** agents 的**原始** context（vendor docs 的粘贴区、长节选）。
- **Format：** 纯文本；简短标题；建议的填充 sections。
- **Examples：** `design-system-reference-llms.txt`、`nixpacks-llms.txt`、`uv-llms.txt` — 按**工具/domain** 命名，而不是神秘名称。

---

## Agent platform bridge files（scaffold 后）

这些文件在 IDE 不自动加载 `AGENTS.md` 时**指向 agents at the harness**。**内容模式**（路径来自**仓库根目录**）：

1. Read `AGENTS.md`，然后 `ARCHITECTURE.md`。
2. Check `docs/exec-plans/active/` for in-flight plans。
3. Check `docs/QUALITY_SCORE.md` for known gaps。

### Cursor — `.cursor/rules/harness.mdc`

创建或合并带有 front matter 的规则文件：

```yaml
---
description: Load project harness (AGENTS.md) before coding tasks
globs: "**/*"
alwaysApply: true
---
```

Body：上面三个编号要点，加上 "Follow **How to use this harness** in `AGENTS.md` for workflows."

### Claude Code / OpenAI Codex

无需额外文件 — `AGENTS.md` 是约定的入口。只在 scaffold **final report** 中提及。

### Windsurf — `.windsurfrules`

追加一个 section（如果需要使用 HTML 注释作为 fences）：

```markdown
## Project harness

Before substantive edits: read `AGENTS.md`, `ARCHITECTURE.md`, `docs/exec-plans/active/`, `docs/QUALITY_SCORE.md`.
```

### GitHub Copilot — `.github/copilot-instructions.md`

追加相同的 **Project harness** 块（如果缺少则创建 `.github/`）。

### Cline — `.clinerules`

追加相同的 **Project harness** 块。

**Merge rule：** 如果文件存在则追加；不要删除不相关的指令。在基于 Markdown 的文件中，优选将追加内容包装在 `<!-- harness-bridge:start -->` … `<!-- harness-bridge:end -->` 中。

---

## Harness update rules（增量更改）

运行 **harness update**（不是完整 scaffold）时：

- **Indexes** — 追加行到 `docs/product-specs/index.md` 和 `docs/design-docs/index.md`；除非与用户协调重新 reconcile，否则不要重写整个表。
- **`AGENTS.md`** — 精确添加或调整 nav links；保留用户 sections。
- **Add-ons** — 启用 Superpowers/Evals：根据 addon references 创建缺失的 dirs/files；在 `AGENTS.md` / `PLANS.md` / `QUALITY_SCORE.md` 中链接，如同完整 scaffold 中一样。
- **Removing domains or add-ons** — 需要明确确认；**在执行前必须列出所有将被修改或删除的文件**；优选用简短注释标记为 deprecated 而不是硬删除。
- **Platform bridges** — 只添加缺失的 bridge 文件或追加缺失的 harness blocks；永不覆盖整个规则文件。
- **Refresh quality score** — 每个标准必须引用具体仓库信号；没有信号时写 **TBD**。

---

## Anti-patterns（所有文件）

- **Blob duplication** — `AGENTS.md` 和 spec 文件中的相同内容。
- **Unlinked files** — 将新 docs 添加到最近的 `index.md`。
- **Stale generated** — 记录重新生成路径或明确标记为过时。
- **Wiping bridge files** — 用 only harness text 替换整个 `.cursor/rules/*` 或 `.windsurfrules`。
- **Fabricated quality data** — 在没有可验证仓库信号的情况下编造覆盖率%、测试数量或分数。
## `docs/memory/feedback/`

### `docs/memory/feedback/user-feedback.md`

- **Purpose：** 记录经过分诊后，确认为 durable、跨任务可复用的用户反馈；不用于保存 task-local 指令。
- **Include：** 字段说明、追加约定、是否需要防止再犯。

### `docs/memory/feedback/agent-feedback.md`

- **Purpose：** 记录来自 Reviewer、Tester 或自检的问题。
- **Include：** 字段说明、`pattern / rule / action_type / risk_level / scope / execution / final_report`、建议处理方式。

### `docs/memory/feedback/prevents-recurrence.md`

- **Purpose：** 记录重复问题及其预防措施。
- **Include：** 计数规则、同步到规范的位置、升级条件。

### `docs/memory/feedback/archive/index.md`

- **Purpose：** 历史 feedback 月度归档索引。
- **Include：** rollup 规则、何时归档、每月归档文件列表。

### `docs/memory/feedback/archive/YYYY-MM.md`

- **Purpose：** 月度 feedback 趋势归档。
- **Include：** 固定 section 顺序：`月度概览`、`代表性问题模式`、`升级到 Prevents-Recurrence`、`备注`。
- **Avoid：** 复制原始 lint / test 输出。

## `docs/feedback/`

### `docs/feedback/feedback-collection.md`

- **Purpose：** feedback 的事实来源规则文档。
- **Include：** 用户反馈、agent feedback、risk-based auto-apply、rollup/archive 规则、`feedback-curator` 的读取约束。
- **Required：** 任何依赖 feedback memory 的 agent 都必须把它当作运行前读取项之一。

## `scripts/checks/`

### `scripts/checks/harness-consistency.js`

- **Purpose：** 用户项目可运行的通用 harness 自检脚本。
- **Include：** 关键 harness 文档存在性、索引覆盖、基础 Markdown 链接、memory/feedback/plan 结构检查。
- **Avoid：** 写死 `cc-harness` 仓库专有规则（例如 `.claude` / `.codex` / 根目录镜像完全一致）作为所有用户项目默认检查项。
- **Scaffold rule：** 推荐在支持脚本的项目中生成；如果当前项目不适合生成脚本，也应在 `AGENTS.md` 或 `PLANS.md` 标注该能力缺失。
