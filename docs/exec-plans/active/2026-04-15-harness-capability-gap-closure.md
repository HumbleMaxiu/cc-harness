# Harness Capability Gap Closure 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 基于外部 agent engineering 最佳实践与 `docs/HARNESS_METHODOLOGY.md`，补齐 `cc-harness` 当前最关键的能力缺口，使其从“文档与流程框架”升级为“可评估、可自适应、可约束、可恢复”的 harness 产品。

**架构：** 先建立 eval 与结构化 consistency check 这类基础能力，确保后续复杂度升级有测量依据；再补齐 scaffold 自适应、工具/权限风险分级、运行轨迹与恢复协议；最后提炼用户可见指南，降低对外使用门槛。整个计划遵循“先简单、先可验证、再加复杂度”的方法论，不以新增更多 agent / docs 为目标。

**技术栈：** Markdown docs, Claude Code Skills/Agents, Node.js checks/hooks, repo fixtures, README/user guides

**外部依据：**
- OpenAI: “A practical guide to building AI agents”
- OpenAI API Docs: “Evaluation best practices”
- Anthropic: “Building effective agents”
- Anthropic Docs: “Tool use with Claude”

---

## 文件结构概览

```text
docs/
  HARNESS_METHODOLOGY.md
  QUALITY_SCORE.md
  RELIABILITY.md
  DESIGN.md
  product-specs/
    harness-engineering.md
    agent-system.md
  exec-plans/
    active/2026-04-15-harness-capability-gap-closure.md
    index.md
  guides/
    harness-guide.md                 # planned
  references/
    eval-scenarios.md

skills/
  harness-setup/SKILL.md
  dev-workflow/SKILL.md

scripts/
  checks/
    harness-consistency.js
    harness-evals.js
  sync/
    mirror-claude-artifacts.js       # planned

fixtures/
  repos/
```

## Phase 1：建立评估与约束基础设施

### 任务 1：建立 harness eval 场景集与回归入口

**优先级：** P0

**文件：**
- 创建：`docs/references/eval-scenarios.md`
- 创建：`fixtures/repos/` 下的最小 fixture 仓库集合
- 创建：`scripts/checks/harness-evals.js`
- 修改：`package.json`
- 修改：`docs/QUALITY_SCORE.md`

- [x] **步骤 1：定义 eval 场景矩阵**

至少覆盖以下场景：

- greenfield scaffold
- existing repo harness update
- add domain / add design doc / complete exec plan
- reviewer `REJECTED` 自动回流
- tester 入口探测与验证降级
- memory / feedback 恢复
- bridge 文件生成与合并
- Skill 模式单 agent workflow 闭环
- Skill 模式 `plan-check-skill` 升级到 `Subagent`
- Skill 模式 `self-review-skill` 产出结构化 `feedback_record`
- Skill 模式 `verification-skill` 记录验证不确定性与未覆盖风险

每个场景必须包含：

- 输入仓库状态
- 用户请求
- 预期产物
- 关键失败信号

当前落地产物：

- `docs/references/eval-scenarios.md` 已定义完整场景矩阵
- `fixtures/repos/*/scenario.json` 已为首批场景补最小 fixture manifests

- [x] **步骤 2：实现最小 eval runner**

实现 `scripts/checks/harness-evals.js`，至少支持：

- 运行 fixture 场景
- 校验关键文件是否生成/更新
- 对照核心断言输出通过/失败
- 为后续 prompt / workflow 回归留出扩展点

当前落地产物：

- `scripts/checks/harness-evals.js` 会读取 `fixtures/repos/*/scenario.json`
- 支持校验 required paths 与基于文件内容的核心 assertions
- 保留从 manifest 继续扩展到更强 fixture runner 的空间

- [x] **步骤 3：补充质量评分入口**

在 `package.json` 中新增例如：

```json
{
  "scripts": {
    "check:harness": "node scripts/checks/harness-consistency.js",
    "check:evals": "node scripts/checks/harness-evals.js"
  }
}
```

并把 `docs/QUALITY_SCORE.md` 从静态说明升级为“能力成熟度 + 信号来源”面板。

当前落地产物：

- `package.json` 已新增 `check:evals`
- `npm test` 已同时执行 consistency + eval checks
- `docs/QUALITY_SCORE.md` 已反映 eval 场景覆盖与能力成熟度

### 任务 2：将 consistency check 从文案匹配升级为结构/行为断言

**优先级：** P0

**文件：**
- 修改：`scripts/checks/harness-consistency.js`
- 修改：`scripts/hooks/session-start.js`
- 修改：相关文档（如 `docs/feedback/feedback-collection.md`、`README.md`）

- [x] **步骤 1：修正现有漂移**

修正当前 check 与 hook 行为之间的旧假设漂移，尤其是：

- SessionStart memory 注入行为
- hook 文档与实现不一致的断言

当前落地产物：

- `scripts/hooks/session-start.js`、`docs/feedback/feedback-collection.md`、`scripts/checks/harness-consistency.js` 已统一到“注入 `using-brainstorming` + 最小 memory 快照”的事实

- [x] **步骤 2：重构检查方式**

将检查从“文件包含某句话”优先升级为：

- 文件结构断言
- 索引覆盖断言
- JSON/配置断言
- hook/脚本行为相关的最小行为断言

当前落地产物：

- `scripts/checks/harness-consistency.js` 已覆盖索引覆盖、Markdown 链接、JSON/配置、镜像目录一致性与 hook 最小行为断言
- `scripts/checks/harness-evals.js` 已补充 fixture manifest + 文件断言层的 eval 检查

- [x] **步骤 3：保留必要的文档语义检查**

仅对必须稳定存在的契约性语义保留文案检查，避免让 check 对正常文案演进过于脆弱。

当前落地产物：

- consistency check 仅对 autonomous/final-gate、feedback archive、dangerous-mode、Skill 模式与 eval 接线等契约性语义保留检查
- 目录结构、索引、镜像与配置正确性优先通过结构化断言完成

## Phase 2：补齐运行时安全与自适应能力

### 任务 3：将 Skill 模式从“概念入口”升级为具体实现模式

**优先级：** P0

**当前状态：** 进行中。Skill 模式的设计、主协议、feedback/memory 对接、内部子 skill 骨架已完成；剩余核心工作是把 Skill 模式纳入 eval 计划，并决定这些内部子 skill 的实际调用方式与示例。

**问题说明：**

当前 `dev-workflow` 对 `Skill 模式` 的描述仍停留在：

- “主 agent 直接执行各阶段”
- 适用于“单一任务、步骤明确”

但尚未定义其真正的实现要素：

- 如何在不调用 subagent 的前提下完成阶段切换
- 是否仍要求显式交接文档
- 阻塞反馈如何在单 agent 内回流
- 与 `Subagent 模式` 的边界在哪里
- 什么条件下必须从 Skill 模式升级到 Subagent / Team 模式

这会导致当前 `dev-workflow` 实际上主要实现的是 agent/subagent 驱动流程，而不是完整的三模式体系。

**设计依据：**

- `docs/design-docs/2026-04-15-dev-workflow-skill-mode-design.md`

本任务以后者为事实来源，按“先定义协议，再同步文档，再补示例，再进入 eval”的顺序推进。

**文件：**
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/design-docs/2026-04-14-dev-workflow-agent-system-design.md`
- 修改：`README.md`
- 必要时创建：Skill 模式示例或参考片段文档
- 必要时修改：相关 agent 定义与示例

- [x] **步骤 1：将设计文档中的状态机落到 workflow 协议**

在 `skills/dev-workflow/SKILL.md` 中把 Skill 模式明确为单 agent workflow，而不是一句概括。至少要写清：

- 进入条件
- 状态顺序：`Input Ready -> Plan Check -> Execute -> Self Review -> Verify -> Doc Sync -> Final Summary`
- 每阶段输入 / 输出
- 阻塞 / 非阻塞反馈如何处理
- 终止条件

要求：

- 明确这是“单 agent 串行执行的显式 workflow”
- 不把 Skill 模式写成“省略版 Subagent 模式”
- 指出主 agent 在 Skill 模式下承担最小 Architect / Reviewer / Tester 职责

- [x] **步骤 2：定义 Skill 模式的最小结构化产物**

基于 design doc 中的 `Skill Workflow Record`，明确 Skill 模式至少要产出：

- `Context`
- `Mode Decision`
- `Execution`
- `Self Review`
- `Verification`
- `Doc Sync`
- `Final Summary`

要求：

- 这些区块要能支撑恢复、审计、memory 写入
- Skill 模式可以不生成多角色 handoff，但不能没有结构化记录
- 明确哪些字段是必须的，哪些是按需扩展的

- [x] **步骤 3：明确 Skill 模式中的反馈与升级规则**

至少同步以下规则：

- Skill 模式中的阻塞反馈来源
- 自检 / 验证失败后的记录与处理方式
- 什么情况下允许主 agent 在 Skill 模式内自动修复
- 什么情况下必须升级到 `Subagent 模式`
- 什么情况下进一步升级到 `Team 模式`

要求升级规则至少覆盖：

- 出现循环审查需求时，Skill → Subagent
- 出现多视角并行审查需求时，Subagent → Team
- 出现高风险、强状态追踪或复杂 tool orchestration 时，禁止继续停留在 Skill 模式

- [x] **步骤 4：同步产品规格与旧设计文档**

把 Skill 模式的新定义同步到：

- `docs/product-specs/agent-system.md`
- `docs/design-docs/2026-04-14-dev-workflow-agent-system-design.md`

要求：

- 旧文档中不再把 Skill 模式写成“主 agent 直接执行各阶段 skill”这种过于抽象的定义
- 三模式的边界描述一致
- 与当前 autonomous / feedback / tester 协议不冲突

- [x] **步骤 5：补齐 README 与用户可见示例**

为三种模式分别提供最小使用示例，避免用户只看到模式名称，看不到真正差异。

至少补齐：

- Skill 模式适用什么任务
- Skill 模式与 Subagent 模式的核心区别
- 何时需要升级模式

- [x] **步骤 6：将 Skill 模式纳入后续 eval 计划**

在任务 1 的 eval 场景设计中显式纳入：

- 单 agent Skill 模式成功闭环
- Skill 模式下因复杂度升级到 Subagent
- Skill 模式下的结构化产物完整性

要求后续 eval 不只覆盖 agent/subagent 回流，也覆盖单 agent workflow 本身。

当前已纳入 `docs/references/eval-scenarios.md` / `scripts/checks/harness-evals.js` 的 Skill 模式重点场景：

- 单 agent Skill 模式成功闭环
- `plan-check-skill` 判定需升级到 `Subagent`
- `self-review-skill` 产出结构化 `feedback_record`
- `verification-skill` 发现验证不确定性并记录未覆盖风险

- [x] **步骤 7：定义 Skill 模式的第一批阶段型专用 Skill**

基于 `docs/design-docs/2026-04-15-dev-workflow-skill-mode-design.md`，先明确 Skill 模式是否需要专用 Skill，以及建议的拆分粒度。

要求：

- 只定义少量阶段型专用 Skill，不按角色镜像拆分
- 第一批建议范围：`plan-check-skill`、`self-review-skill`、`verification-skill`
- 明确哪些阶段暂时保留在 `dev-workflow` 主 skill 内，如 `Execute`、`Doc Sync`、`Final Summary`
- 明确这些专用 Skill 初期作为内部子 skill 使用，而不是立即变成面向用户的顶层入口

- [x] **步骤 8：落成 `plan-check-skill` 的内部骨架**

已在 `dev-workflow` 下创建第一版内部子 skill：

- `internal-skills/plan-check-skill/SKILL.md`

当前范围：

- 定义 Purpose / Inputs / Output contract / Escalation rules / Boundaries
- 作为 `Skill 模式` 的 `Plan Check` 阶段协议
- 暂不作为用户顶层入口公开

- [x] **步骤 9：落成 `self-review-skill` 与 `verification-skill` 的内部骨架**

已在 `dev-workflow` 下创建：

- `internal-skills/self-review-skill/SKILL.md`
- `internal-skills/verification-skill/SKILL.md`

当前范围：

- `self-review-skill`：定义结构化自检、`feedback_record` 输出与升级条件
- `verification-skill`：定义验证入口探测、验证输出与升级条件
- 两者都保持为内部子 skill，不作为用户顶层入口公开

#### 当前已落成产物

- Skill 模式专项设计：
  - `docs/design-docs/2026-04-15-dev-workflow-skill-mode-design.md`
- Skill 模式主协议：
  - `skills/dev-workflow/SKILL.md`
  - `.claude/skills/dev-workflow/SKILL.md`
  - `.codex/skills/dev-workflow/SKILL.md`
- Skill 模式内部子 skill 契约：
  - `skills/dev-workflow/internal-skills/plan-check-skill/SKILL.md`
  - `skills/dev-workflow/internal-skills/self-review-skill/SKILL.md`
  - `skills/dev-workflow/internal-skills/verification-skill/SKILL.md`
- 子 skill 统一说明：
  - `skills/dev-workflow/references/skill-mode-specialized-skills.md`
- 已同步 supporting docs：
  - `docs/product-specs/agent-system.md`
  - `docs/design-docs/2026-04-14-dev-workflow-agent-system-design.md`
  - `docs/feedback/feedback-collection.md`
  - `docs/memory/feedback/agent-feedback.md`
  - `README.md`

#### 下一会话建议切入点

下一会话建议优先完成步骤 6，把 Skill 模式纳入 eval 计划。推荐顺序：

1. 在任务 1 中补 `eval-scenarios`，显式加入以下 Skill 模式场景：
   - 单 agent Skill 模式成功闭环
   - `plan-check-skill` 判定需升级到 Subagent
   - `self-review-skill` 产出结构化 `feedback_record`
   - `verification-skill` 发现验证不确定性并记录未覆盖风险
2. 决定 `dev-workflow` 主 skill 未来如何引用 3 个内部子 skill：
   - 先保持文档契约级引用
   - 或补最小“调用说明 / 模板片段”
3. 视情况补一个最小示例，展示完整 `Skill Workflow Record` 如何拼装 `Mode Decision`、`Self Review`、`Verification`

### 任务 4：为 harness 引入工具/权限风险分级模型

**优先级：** P1

**文件：**
- 修改：`docs/SECURITY.md`
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/product-specs/harness-engineering.md`
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：相关 agent 定义

- [x] **步骤 1：定义风险等级**

至少定义：

- read-only
- reversible write
- irreversible write
- external side effect

并明确不同等级对应的：

- 默认允许策略
- 自动执行白名单/黑名单
- 最终确认要求

当前落地产物：

- `docs/SECURITY.md` 已定义 `read-only / reversible-write / irreversible-write / external-side-effect` 四级操作风险
- 已明确默认策略、自动执行白名单/黑名单与最终确认要求

- [x] **步骤 2：把风险模型接入 workflow**

让 `dev-workflow`、Reviewer、Tester、Feedback Curator 在记录与决策时使用统一风险语言，避免各处各自表述。

当前落地产物：

- `skills/dev-workflow/SKILL.md` 已接入统一 `operation_risk` 语言与 `Operation Gate`
- `agents/reviewer.md`、`agents/tester.md`、`agents/feedback-curator.md` 已同步风险模型
- `docs/product-specs/agent-system.md` 已补齐跨模式统一风险语言

- [x] **步骤 3：补充用户输入到工具调用的约束模板**

为高风险工具调用定义更清晰的参数校验与用户确认语义，降低 prompt 层单点失效风险。

当前落地产物：

- `docs/SECURITY.md`、`docs/product-specs/harness-engineering.md`、`skills/dev-workflow/SKILL.md` 已加入 `Operation Gate` 约束模板
- workflow 使用统一的风险/权限语言处理自动执行与高风险确认

### 任务 5：让 harness-setup 支持自适应 scaffold profile

**优先级：** P1

**文件：**
- 修改：`skills/harness-setup/SKILL.md`
- 修改：`docs/HARNESS_METHODOLOGY.md`
- 修改：`docs/product-specs/harness-engineering.md`
- 修改：`README.md`

- [ ] **步骤 1：定义 profile**

至少定义：

- light：小项目 / 低风险 / 快速起步
- standard：默认团队协作
- strict：高风险 / 高规范 / 更强 gate

- [ ] **步骤 2：定义自动检测规则**

根据仓库信号决定推荐 profile，例如：

- repo 规模
- 是否已有 CI / tests / monorepo 结构
- 是否有多平台 agent 使用需求
- 是否存在敏感目录或部署脚本

- [ ] **步骤 3：调整 scaffold 输出**

不同 profile 应影响：

- 默认生成的文档集
- workflow 强度
- hooks / checks 推荐程度
- 用户需要看到的操作复杂度

## Phase 3：增强恢复性与运维能力

### 任务 6：补齐运行轨迹与恢复协议

**优先级：** P1

**文件：**
- 修改：`docs/RELIABILITY.md`
- 修改：`docs/memory/index.md`
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：相关 agent 文档
- 创建：必要的轨迹格式说明文档

- [x] **步骤 1：定义 run trace 最小结构**

至少记录：

- 当前任务 id / plan path
- 当前阶段
- 最近一次 handoff
- 关键命令与结果
- 最近失败原因
- 恢复入口

当前落地产物：

- `docs/references/run-trace-protocol.md` 已定义最小 `Run Trace` 结构
- `skills/dev-workflow/SKILL.md` 已把 `Run Trace` 接入 `Skill Workflow Record` 和统一交接文档骨架

- [x] **步骤 2：定义 resume protocol**

明确新会话、`/compact`、中断恢复时的读取顺序和停止条件，避免仅靠口头恢复。

当前落地产物：

- `docs/RELIABILITY.md` 与 `docs/references/run-trace-protocol.md` 已定义新会话、`/compact`、中断恢复的读取顺序与停止条件
- `dev-workflow` 已明确遇到未决 `Operation Gate` 时不得继续高风险动作

- [x] **步骤 3：确定哪些轨迹写入长期 memory，哪些只保留在任务层**

避免把临时运行日志污染长期知识层。

当前落地产物：

- `docs/memory/index.md` 已明确长期 memory 与任务层 `Run Trace` 的边界
- `docs/references/run-trace-protocol.md` 已区分长期记忆、任务层轨迹和不应沉淀的临时日志

### 任务 7：建立单一事实源与镜像同步机制

**优先级：** P2

**文件：**
- 创建：`scripts/sync/mirror-claude-artifacts.js`
- 修改：`README.md`
- 修改：`docs/QUALITY_SCORE.md`
- 修改：相关 check

- [x] **步骤 1：明确单一事实源**

继续以 `.claude/` 为事实源，但把同步过程工具化，而不是仅靠人工维护。

当前落地产物：

- README 已明确 `.claude/` 为事实源
- 新增 `scripts/sync/mirror-claude-artifacts.js` 作为可重复执行的镜像同步入口

- [x] **步骤 2：实现最小 sync 命令**

将 `.claude/skills`、`.claude/agents` 到根目录和 `.codex/` 的镜像更新收敛到一个可重复运行的脚本。

当前落地产物：

- `npm run sync:mirrors` 已接入 `scripts/sync/mirror-claude-artifacts.js`
- 当前同步范围覆盖 `.claude/skills`、`.claude/agents`、`.claude/scripts/hooks` 到根目录和 `.codex/`
- 根目录 `hooks/` 也会同步到 `.claude/hooks` 与 `.codex/hooks`

- [x] **步骤 3：把 sync 校验接入 repo checks**

保证镜像失配可以被自动发现。

当前落地产物：

- `scripts/checks/harness-consistency.js` 已校验 `sync:mirrors` 脚本入口与镜像同步文档
- 现有 mirror directory checks 会在镜像内容失配时直接失败

## Phase 4：补齐用户可见层

### 任务 8：提炼用户版 Harness Guide

**优先级：** P1

**文件：**
- 创建：`docs/guides/harness-guide.md`
- 修改：`README.md`
- 修改：`AGENTS.md`（如需增加导航）

- [ ] **步骤 1：从内部方法论提炼用户版原则**

保留：

- 什么时候从 `/harness-setup` 开始
- 什么时候使用 `/brainstorming`、`/writing-plans`、`/dev-workflow`
- 什么时候需要升级到 strict profile
- 如何维护 docs / memory / feedback

不直接暴露内部治理细节。

- [ ] **步骤 2：补齐升级路径**

给用户明确“小项目轻量用法”与“复杂项目增强用法”的决策树。

- [ ] **步骤 3：接入 README**

确保用户从 README 就能发现这份指南，而不必自己在多个内部文档间跳转。

### 任务 9：把 update 模式升级为迁移系统

**优先级：** P2

**文件：**
- 修改：`skills/harness-setup/SKILL.md`
- 修改：`docs/product-specs/harness-engineering.md`
- 修改：相关 check / refs

- [ ] **步骤 1：定义 migration 概念**

让 update 不只是“编辑菜单”，而是具备：

- 版本化升级
- profile 迁移
- 新规范补丁应用

- [ ] **步骤 2：定义 migration report**

执行 update 后输出：

- 修改了哪些文件
- 哪些规则被升级
- 哪些部分仍需用户确认
- 是否存在兼容性风险

- [ ] **步骤 3：让 migration 进入 eval 场景**

确保旧 harness 升级到新约束时有回归保护。

## 验收标准

- `cc-harness` 拥有最小可运行的 harness eval 场景集，而不是只靠人工判断
- consistency check 不再主要依赖脆弱文案匹配
- scaffold 能根据项目特征推荐不同约束 profile
- workflow 使用统一的风险/权限语言处理自动执行与最终确认
- 中断恢复有明确协议，而不是靠临时上下文
- 用户可以通过一份简洁指南理解如何使用和升级 harness

## 交付顺序建议

建议按以下顺序推进：

1. 任务 1：harness eval 场景集
2. 任务 2：结构化 consistency check
3. 任务 3：Skill 模式具体实现
4. 任务 4：工具/权限风险分级
5. 任务 5：自适应 scaffold profile
6. 任务 8：用户版 Harness Guide
7. 任务 6：运行轨迹与恢复协议
8. 任务 7：镜像同步机制
9. 任务 9：migration 系统
