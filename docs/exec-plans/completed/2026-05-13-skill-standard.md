# Skill 标准方案实施计划

> **面向 agent worker：** 本计划用于把已确认的 Skill 标准方案落成文档、生成规范、审计检查和三方 skill 引入约束。执行时使用 `/dev-workflow`；每个阶段完成后更新本文进度。

**目标：** 建立 `cc-harness Skill Standard`，让自研 skill、feedback 生成 skill、三方引入 skill 都能按统一标准创建、审计、安装和维护。

**架构：** 以 Anthropic Agent Skills 基础形态为兼容底座，在其上增加 cc-harness docs-first、Codex compatibility、output contract、source attribution、pressure scenarios 和 audit rules。标准文档是事实源，`/skill-creator` 和未来 `/skill-audit` / check script 消费它。

**技术栈：** Markdown docs、`skills/`、Node.js check script、Codex / Claude Code runtime projection。

---

## 背景

我们已确认：

- Skill 基础形态参考 Anthropic Agent Skills：一个目录一个 `SKILL.md`，使用 YAML frontmatter，复杂资料放 `references/` / `scripts/`。
- `cc-harness` 需要更强标准：docs 读取入口、workflow 位置、输出 contract、失败回流、feedback/memory 边界、Codex compatibility。
- 可以复用或改编 GitHub 上已有三方 skill，但不新增 `vendor-skills/`；统一放入 `skills/`，并在 `references/source.md` 记录来源。
- `/skill-creator` 后续应能按标准生成 skill；根据用户 feedback 生成 skill 时也必须走同一套标准。
- `/skill-audit` 或检查脚本应能判断已有 skill 是否符合标准。

## 当前状态

已完成：

- [x] 明确三方 skill 不使用 `vendor-skills/`，统一放入 `skills/`
- [x] 新增 [third-party-skill-integration.md](../../design-docs/third-party-skill-integration.md)
- [x] 在 [skill-system.md](../../product-specs/skill-system.md) 中记录三方 skill 引入原则

待完成：

- [x] 完成 Skill 标准调研与来源记录
- [x] 建立通用 Skill 标准文档
- [x] 更新 `/skill-creator`，让生成和审计都引用标准
- [x] 引入 pressure scenarios / behavior tests，用于验证 skill 是否真的改变 agent 行为
- [x] 新增 skill 标准检查脚本
- [x] 定义专项 review packs 的接入规范和首批候选
- [x] 提供手动检查入口，并预留 PM orchestrator 后续选择性调度

## 文件结构

预计新增或修改：

- 创建：`docs/references/skill-standard-research.md`
- 创建：`docs/references/skill-standard.md`
- 修改：`skills/skill-creator/SKILL.md`
- 可选创建：`skills/skill-audit/SKILL.md`
- 创建：`scripts/checks/skill-standard.mjs`
- 修改：`docs/product-specs/skill-system.md`
- 修改：`docs/design-docs/third-party-skill-integration.md`
- 修改：`docs/PLANS.md`
- 可选创建：`docs/references/skill-pressure-scenarios.md`
- 可选创建：`docs/references/review-pack-registry.md`
- 修改：`AGENTS.md` / `README.md`（如果需要暴露新入口）

## 任务 0：Skill 标准调研与来源记录

**文件：**
- 创建：`docs/references/skill-standard-research.md`
- 修改：`docs/references/index.md`

- [x] 调研 Anthropic Agent Skills 官方/示例，记录基础目录结构、frontmatter、description 触发语义、progressive disclosure
- [x] 调研 Supabase agent-skills，记录 frontmatter 约束、description 规则、测试/发布 discipline
- [x] 调研 Sentry skills，记录 repo-root `skills/` 组织、AGENTS.md / skill source 布局、工程团队维护方式
- [x] 调研 Superpowers，记录 pressure scenarios / RED-GREEN-REFACTOR 这类 skill behavior testing 方法
- [x] 调研 Trail of Bits skills，记录 workflow skill design、skill improver、专项 review packs 的结构和可复用模式
- [x] 对每个来源记录：
  - source project
  - URL
  - license
  - relevant files / paths
  - 可直接复用的规则
  - 需要本地适配的规则
  - 不采用的规则及原因
- [x] 输出本地取舍结论：哪些进入 `skill-standard.md`，哪些进入三方 skill 引入设计，哪些暂不采用

验收：
- `docs/references/skill-standard-research.md` 存在
- 标准文档、`/skill-creator`、检查脚本、pressure scenarios、review packs 的后续设计都能追溯到该调研记录
- 如果某项规则没有外部依据，也必须说明它来自 cc-harness 本地需求

## 任务 1：基于调研编写通用 Skill 标准文档

**文件：**
- 创建：`docs/references/skill-standard.md`
- 修改：`docs/references/index.md`

- [x] 先读取 `docs/references/skill-standard-research.md`，只采用其中已记录来源或已说明本地需求的规则
- [x] 定义标准 skill 目录结构

包含：

```text
skills/<skill-name>/
├── SKILL.md
├── references/
├── scripts/
└── assets/
```

- [x] 定义 `SKILL.md` frontmatter 规则

至少包括：

```yaml
---
name: <skill-name>
description: <触发场景 + 能力说明>
---
```

验收：
- `name` 必须等于目录名
- `description` 必须包含触发场景，不能只是泛泛描述

- [x] 定义正文必备 section

建议最小集：

```markdown
## 何时使用
## 何时不要使用
## 输入 / 读取项
## 执行流程
## 输出格式
## 暂停 / 阻塞条件
```

- [x] 定义 `references/`、`scripts/`、`assets/` 使用规则

要求：
- 长背景放 `references/`
- 可执行 helper 放 `scripts/`
- 模板或静态资源放 `assets/`
- `SKILL.md` 必须显式链接或说明何时加载这些文件

- [x] 定义 cc-harness 扩展规则

包括：
- docs-first：说明需要读取哪些 docs
- workflow：说明属于 vibe coding、AI coding、review、test、PM orchestration 哪个阶段
- output contract：必须可被 `/dev-workflow`、`/harness-quality-gate` 或未来 `/pm-orchestrator` 消费
- feedback/memory boundary：不能把 task-local 指令误写入长期 memory
- Codex compatibility：不能写死 Claude-only 假设
- pressure scenarios：重要 skill 应记录“没有 skill 时 agent 会犯什么错”，并用场景验证 skill 是否阻止该错误

## 任务 2：基于调研定义三方 Skill 标准引用关系

**文件：**
- 修改：`docs/design-docs/third-party-skill-integration.md`
- 修改：`docs/product-specs/skill-system.md`

- [x] 先读取 `docs/references/skill-standard-research.md`，确认三方引入规则的外部来源和本地取舍
- [x] 将三方 skill 引入设计改为引用 `docs/references/skill-standard.md`
- [x] 明确 `references/source.md` 是三方 skill 的额外必需项
- [x] 明确 license 不可用时只能记录候选，不能复制到仓库

验收：
- 三方引入设计不重复完整标准，只保留 source attribution、license 和 import policy
- skill-system spec 能指向通用标准和三方引入设计

## 任务 3：基于调研增强 `/skill-creator`

**文件：**
- 修改：`skills/skill-creator/SKILL.md`

- [x] 先读取 `docs/references/skill-standard-research.md` 与 `docs/references/skill-standard.md`
- [x] 生成模式必须读取 `docs/references/skill-standard.md`
- [x] 生成新 skill 时必须产出标准 section
- [x] 如果输入来自 feedback / recurrence，必须先抽象 pressure scenario
- [x] 审计模式必须按标准输出检查结果
- [x] 三方 skill 模式必须要求 `references/source.md`

建议输出：

```markdown
### Skill Creator Result
- skill_path:
- standard_version:
- generated_sections:
- pressure_scenarios:
- source_attribution:
- audit_status:
- follow_up:
```

## 任务 4：基于调研引入 Skill Pressure Scenarios

**文件：**
- 修改：`docs/references/skill-standard.md`
- 可选创建：`docs/references/skill-pressure-scenarios.md`
- 修改：`skills/skill-creator/SKILL.md`

- [x] 先读取 `docs/references/skill-standard-research.md` 中 Superpowers 相关记录
- [x] 将 Superpowers 的 RED-GREEN-REFACTOR 思路写入标准：
  - RED：先记录没有 skill 时 agent 会失败的压力场景
  - GREEN：创建或修改 skill，让 agent 在该场景下做出期望行为
  - REFACTOR：收紧 skill 文案、输出 contract 和边界，避免过拟合单个例子
- [x] 定义 pressure scenario 最小格式：

```markdown
### Pressure Scenario
- id:
- skill_under_test:
- user_input:
- failure_without_skill:
- expected_behavior_with_skill:
- evidence_required:
- status: proposed / passing / failing
```

- [x] `/skill-creator` 在从 feedback / recurrence 生成 skill 时，必须先抽象至少一个 pressure scenario
- [x] 三方 skill 引入时，如果是关键 workflow / review pack，应补一个本地 pressure scenario，验证其是否符合 cc-harness 目标
- [x] 检查脚本第一版可以只提示缺少 pressure scenarios，不强制 fail

验收：
- Skill Standard 明确 pressure scenarios 是重要 skill 的行为验证方式
- feedback 生成 skill 的路径中包含 pressure scenario
- 三方 review pack 引入规范中说明关键 pack 需要本地 pressure scenario

## 任务 5：基于调研新增 skill 标准检查脚本

**文件：**
- 创建：`scripts/checks/skill-standard.mjs`

- [x] 先读取 `docs/references/skill-standard-research.md` 与 `docs/references/skill-standard.md`
- [x] 扫描 `skills/*/SKILL.md`
- [x] 校验 frontmatter
- [x] 校验 `name` 与目录一致
- [x] 校验 `description` 非空且有触发语义
- [x] 校验必备 section
- [x] 检查关键 skill 是否声明 pressure scenarios 或说明豁免原因
- [x] 校验三方来源 skill 的 `references/source.md`
- [x] 输出 machine-readable 和 human-readable 结果

建议命令：

```bash
node scripts/checks/skill-standard.mjs
```

验收：
- 当前仓库已有 skill 可运行检查
- 不要求第一版所有 skill 全部通过，但必须输出清晰 warnings / failures

## 任务 6：基于调研决策是否新增 `/skill-audit`

**文件：**
- 可选创建：`skills/skill-audit/SKILL.md`
- 修改：`README.md`
- 修改：`AGENTS.md`
- 修改：`docs/product-specs/skill-system.md`

- [x] 先读取 `docs/references/skill-standard-research.md`，确认三方是否有独立 audit / improver 模式可借鉴
- [x] 决策更新：用户确认需要独立 `/skill-audit`
- [x] 独立新增 `/skill-audit`，供用户和未来 PM gate 调度；`/skill-creator` 保留创建/改造时的自检职责

决策点：
- 已拆出 `/skill-audit`，`skill-creator` 不再是唯一 audit 入口

## 任务 7：基于调研定义专项 Review Packs 接入规范

**文件：**
- 修改：`docs/design-docs/third-party-skill-integration.md`
- 可选创建：`docs/references/review-pack-registry.md`
- 修改：`docs/product-specs/skill-system.md`

- [x] 先读取 `docs/references/skill-standard-research.md` 中 Trail of Bits / Sentry / Playwright 相关记录
- [x] 定义 review pack 与普通 skill 的区别：review pack 是可被 PM orchestrator 在特定阶段按 capability 调度的专项审查/验证能力
- [x] 定义首批 capability：
  - `security_review`
  - `github_actions_review`
  - `supply_chain_audit`
  - `ui_verification`
  - `ci_cd_triage`
- [x] 为每个 capability 记录候选三方来源、license 状态、是否可复制、是否需要 wrapper
- [x] 明确本计划不直接实现具体 review pack，只定义接入规范和 registry
- [x] 明确任何 review pack 落地为 `skills/<local-name>/` 后，都必须通过 Skill Standard 和 source attribution 检查
- [x] 明确关键 review pack 需要本地 pressure scenario，以验证三方 skill 能改变 agent 的 review 行为

建议 registry 格式：

```markdown
| Capability | Local Skill | Source Project | Source Path | License | Status | Notes |
|------------|-------------|----------------|-------------|---------|--------|-------|
```

验收：
- 三方 skill 引入设计能解释 review packs 如何按 capability 接入
- PM orchestrator 后续可以读取 registry 或设计文档决定调度哪个 review pack
- 不把 review pack 接入误写成当前已实现能力

## 任务 8：预留 PM Orchestrator 调度接口

**文件：**
- 修改：`docs/PLANS.md`
- 修改：未来 PM orchestrator 设计文档（创建后）

- [x] 记录 Skill Standard 检查应由 PM orchestrator 按任务类型选择性发布，不作为每次 quality gate 的默认强制项
- [x] 定义触发条件：创建/修改 skill、引入三方 skill、feedback 生成 skill、PM orchestrator 要求 skill health check
- [x] 保留手动命令入口，供开发者按需运行

## 验收标准

- `docs/references/skill-standard.md` 存在，并成为通用 Skill 标准事实源
- `docs/references/skill-standard-research.md` 存在，并记录外部来源、本地取舍和不采用原因
- 三方 skill 引入设计引用通用标准，不重复定义全部标准
- `/skill-creator` 明确按标准生成 / 审计 skill
- Skill 标准包含 pressure scenarios / behavior tests，且 feedback 生成 skill 必须先抽象压力场景
- `scripts/checks/skill-standard.mjs` 可运行并输出当前 skill 质量结果
- Skill Standard 检查有明确手动入口，并说明后续由 PM orchestrator 选择性调度
- 专项 review packs 有接入规范和首批 capability 列表，但不要求本计划内实现具体 pack
- `/skill-audit` 已新增，README / AGENTS / skill-system spec 已同步

## 风险与决策

- **是否新增 `/skill-audit`：** 已根据后续用户决策拆出独立入口；`/skill-creator` 负责创建/改造时自检，`/skill-audit` 负责用户和 PM gate 可调度审计。
- **是否强制所有现有 skill 一次性通过：** 不建议。第一版检查脚本可以先输出 warnings，后续逐步收紧。
- **三方 skill license：** 不清晰时不复制内容，只在候选列表记录。
- **Codex / Claude compatibility：** 标准必须避免 host-specific 假设；必要时写清 platform-specific 分支。

## Run Trace

```markdown
### Run Trace
- trace_id: skill-standard-2026-05-13
- plan_path: docs/exec-plans/completed/2026-05-13-skill-standard.md
- task_scope: Skill 标准方案文档、生成、审计和三方引入规则
- current_phase: completed
- archived_at: 2026-05-13
- last_handoff: Skill Standard 首版已落地，/skill-creator 已对齐，检查脚本可运行
- files_touched:
  - docs/exec-plans/completed/2026-05-13-skill-standard.md
  - docs/references/skill-standard-research.md
  - docs/references/skill-standard.md
  - docs/references/skill-pressure-scenarios.md
  - docs/references/review-pack-registry.md
  - docs/references/index.md
  - docs/design-docs/third-party-skill-integration.md
  - docs/product-specs/skill-system.md
  - docs/PLANS.md
  - skills/skill-creator/SKILL.md
  - skills/skill-audit/SKILL.md
  - skills/skill-audit/references/pressure-scenarios.md
  - scripts/checks/skill-standard.mjs
  - README.md
  - AGENTS.md
- commands_run:
  - curl raw GitHub sources for Anthropic, Supabase, Sentry, Superpowers, Trail of Bits
  - node --check scripts/checks/skill-standard.mjs
  - node scripts/checks/skill-standard.mjs
  - node scripts/checks/skill-standard.mjs --json
  - ./install.sh --target codex --dest <tmpdir>
  - git diff --check
- last_result: `skill-standard.mjs` ran with 23 skills, 0 errors, 125 warnings; `/skill-audit` has 0 warnings; warnings represent existing skill migration debt
- last_failure_reason:
- resume_entry: 后续如继续推进，应从逐步迁移现有 skill 的 warnings 开始；本计划首版目标已完成
```
