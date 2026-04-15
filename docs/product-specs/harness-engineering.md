# Product Spec — Harness Engineering

> **Domain：** harness-engineering

## 目标

提供一套标准化的 harness 脚手架生成工具，让任何项目能够快速搭建符合 OpenAI harness engineering 原则的 agent 协作环境。

## 用户可见行为

### `/harness-setup` Skill

用户运行 `/harness-setup` 后，经过少量问答（项目名称、架构类型、domains、agent 平台），生成：

- `AGENTS.md` — agent 操作入口和文档索引
- `ARCHITECTURE.md` — 项目技术架构图
- `docs/` 目录树 — 含 design-docs/、exec-plans/、product-specs/、generated/、references/
- `docs/feedback/feedback-collection.md` 与 `docs/memory/feedback/archive/` — feedback 规则与历史归档结构
- Agent platform bridge 文件（按需）

### 文档责任矩阵

`file-specs.md` 中定义的文档不一定都需要“一个独立 skill”，但必须至少有一个明确责任入口：要么是 scaffold 生成，要么是某个 agent/skill 在运行期维护。

| 文档类别 | 主要入口 | 持续维护入口 |
|---------|---------|-------------|
| `ARCHITECTURE.md` | `/harness-setup` | `architect` |
| `docs/DESIGN.md` | `/harness-setup` | `architect` |
| `docs/PLANS.md` | `/harness-setup` | `architect` |
| `docs/PRODUCT_SENSE.md` | `/harness-setup` | `architect` |
| `docs/RELIABILITY.md` | `/harness-setup` | `architect` / bugfix workflow |
| `docs/SECURITY.md` | `/harness-setup` | `architect` / reviewer |
| `docs/FRONTEND.md` | `/harness-setup`（如适用） | 前端相关设计/实现流程 |
| `AGENTS.md` | `/harness-setup` | `architect` |
| `docs/design-docs/*` | `/brainstorming` | `architect` |
| `docs/exec-plans/*` | `/writing-plans` | `architect` / `dev-workflow` |
| `docs/product-specs/*` | `/harness-setup` 初始化 domain | 用户任务流 + `architect` |
| `docs/memory/index.md` | `/harness-setup` | 主 agent / `feedback-curator` |
| `docs/memory/feedback/*` | `/harness-setup` | `feedback-curator` |
| `docs/feedback/feedback-collection.md` | `/harness-setup` | `feedback-curator` + `architect` |
| `docs/generated/*` | `/harness-setup` 占位 | 领域实现流程或项目脚本 |
| `docs/references/*` | `/harness-setup` 占位 | 人工维护或专项 skill |
| `docs/QUALITY_SCORE.md` | `/harness-setup` | `architect` / update workflow |
| `scripts/checks/harness-consistency.js` | `/harness-setup`（推荐生成） | `architect` / tester |

### 当前原则

- 不是每份文档都必须拥有一个专属 skill。
- 但每份文档都必须能回答两个问题：
  - 初次由谁生成？
  - 后续由谁维护？
- 如果某类文档既没有 scaffold 入口，也没有维护入口，那就是 harness 缺口，应补 skill、agent 或 workflow 责任映射。

### 项目级文档与任务级文档的边界

以下文档是**项目级、相对稳定**的长期文档：

- `ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/PLANS.md`
- `docs/PRODUCT_SENSE.md`
- `docs/RELIABILITY.md`
- `docs/SECURITY.md`
- `docs/FRONTEND.md`（如适用）

它们的职责不是重复 `design-docs/` 或 `exec-plans/`，而是提供长期背景：

- `DESIGN.md`：项目级设计原则和系统优化目标
- `PLANS.md`：项目路线图占位与稳定工作流导航，不是某次任务计划
- `PRODUCT_SENSE.md`：用户画像、非目标、好坏判断标准
- `RELIABILITY.md`：可靠性原则和恢复策略
- `SECURITY.md`：安全约束和 secrets/auth/audit 原则
- `ARCHITECTURE.md`：顶层技术地图

而以下文档是**任务级、会变化更快**的执行文档：

- `docs/design-docs/*.md`：某个设计议题的详细设计
- `docs/exec-plans/*.md`：某次任务的执行计划与进度

### Scaffold 生成原则

- scaffold 可以生成项目级文档的**骨架和最小可用内容**
- 但不能伪造项目路线图、业务策略或未经确认的中长期判断
- 如果缺少足够用户输入，必须使用：
  - 明确假设
  - `TBD`
  - “待用户确认”

尤其是 `docs/PLANS.md`：

- 默认只应包含 harness 工作流导航和项目路线图占位
- 不应在用户未确认时随机生成具体 roadmap
- 在用户审查通过前，不应被当作项目真实路线图使用

### 沉淀触发条件

项目级文档应当从下层事实中**逐步沉淀**，而不是在 scaffold 时一次写满。

- `ARCHITECTURE.md`
  - 初始：目录/模块骨架 + 待补充说明
  - 触发：当关键模块边界、依赖方向、数据流已在实现或 design docs 中稳定出现时更新
- `docs/DESIGN.md`
  - 初始：项目级设计原则骨架
  - 触发：当已有多个 `docs/design-docs/*.md` 可提炼出稳定共性时更新
- `docs/PLANS.md`
  - 初始：workflow 导航 + roadmap 占位
  - 触发：当已有多个 `docs/exec-plans/completed/*.md` 或用户明确给出中长期方向时更新
- `docs/PRODUCT_SENSE.md`
  - 初始：用户画像/非目标模板
  - 触发：当用户明确产品目标，或多个 domain spec 已形成稳定产品边界时更新
- `docs/RELIABILITY.md`
  - 初始：恢复策略与幂等性模板
  - 触发：当出现真实运行约束、测试验证模式或故障处理经验时更新
- `docs/SECURITY.md`
  - 初始：安全基线模板
  - 触发：当仓库存在实际 secrets/auth/audit 方案或 reviewer 反馈沉淀出安全规则时更新
- `docs/FRONTEND.md`
  - 初始：前端约定骨架
  - 触发：当已有页面设计、组件模式或 a11y 约束可总结时更新

### 归档到沉淀层的来源

项目级文档的内容应优先从以下来源提炼：

- `docs/design-docs/*.md`
- `docs/exec-plans/active/*.md`
- `docs/exec-plans/completed/*.md`
- `docs/product-specs/*.md`
- `docs/memory/feedback/prevents-recurrence.md`
- 已验证的实现结构与测试入口

这意味着项目级文档是“归档后的知识层”，不是初始化时的猜测层。

### 用户可用性原则

- `cc-harness` 的首要目标是为用户项目生成好用的 harness，而不是只让本仓库自洽
- 本仓库中的实现和自检，应优先服务于“用户 scaffold 后能否真正使用”
- repo 自身同步只是测试手段，不是最终目标

### Generic Harness Check

`scripts/checks/harness-consistency.js` 不应只服务 `cc-harness` 仓库本身。

对于用户项目，更有价值的是生成一个**通用版 harness self-check**，至少检查：

- 关键 harness 文档是否存在
- index 与目录是否一致
- 关键 Markdown 链接是否有效
- memory / feedback / plan 基础结构是否存在

只有像 `.claude ↔ skills ↔ .codex` 镜像一致性这类仓库私有规则，才属于插件自身自检，而不是所有用户项目的默认要求。

### 交互流程

1. 自动检测项目 baseline（greenfield vs existing）
2. 收集上下文：名称、目的、架构类型、domains、agent 平台
3. 汇总确认（硬性门槛：确认前不创建文件）
4. 创建目录结构
5. 填充文件
6. 审查检查点
7. 验证交叉链接
8. 生成 platform bridges

## CLI/API 接触点

| 接触点 | 描述 |
|--------|------|
| `/harness-setup` | Claude Code skill 入口 |
| `/harness-setup update` | 增量更新现有 harness |

## Edge Cases

- **已有 harness**：提示用户选择 re-scaffold（覆盖）或 update（增量修改）
- **缺失关键目录**：只创建缺失的目录，不删除用户文件
- **无 package.json**：检测 Node.js 以外的项目时，调整 stack 推断

## 相关文档

- [docs/PLANS.md](../PLANS.md)
- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
- skill-creator SKILL：`skills/skill-creator/SKILL.md`
