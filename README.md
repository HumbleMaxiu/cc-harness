# cc-harness

`cc-harness` 是一个面向 Claude Code 的 harness engineering 插件仓库，帮助项目建立可持续的 AI 协作环境。

它提供一套可复用的：

- skills
- agents
- hooks
- MCP 配置模板
- 文档与 memory 约束

目标不是做一个新的执行引擎，而是把“AI 如何在仓库里协作”这件事产品化、版本化、可审查化。

## 核心痛点与当前解法

`cc-harness` 不是单纯往项目里塞一批 prompt，而是针对 AI 协作里最常见的失败模式给出固定入口。

| 痛点 | 当前解法 | 当前强度 |
|------|----------|----------|
| 先写代码后思考 | `/brainstorming` + `/writing-plans` + `AGENTS.md` hard gate | 强 |
| 计划漂移 | `docs/exec-plans/active/` + Run Trace + `/plan-persist` + planning hooks | 中强 |
| 验证缺失 | `/dev-workflow` + Reviewer / Tester / Challenger + `/harness-quality-gate` | 中强 |
| 文档腐坏 | `/doc-sync` + index + consistency checks | 强 |
| 反馈无法沉淀 | `/feedback` + feedback memory + recurrence + skill promotion path | 中强 |
| 恢复困难 | SessionStart memory 注入 + Run Trace + `/plan-persist` hooks | 中强 |

更完整的产品视图见 [docs/design-docs/2026-04-16-harness-pain-point-matrix.md](docs/design-docs/2026-04-16-harness-pain-point-matrix.md)。

## 核心能力

### 1. Harness 脚手架

通过 `harness-setup` 等 skills，为项目生成或更新：

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/design-docs/`
- `docs/exec-plans/`
- `docs/product-specs/`
- `docs/memory/`

### 2. 产品级根入口

除了实现 workflow，本仓库还提供面向最终用户的根入口：

- `/harness-help`
- `/harness-guide`
- `/harness-audit`
- `/harness-quality-gate`
- `/feedback`

它们分别负责入口导航、场景推荐、健康检查、交付前门禁和用户反馈收集。

### 3. 结构化开发流程

内置多种协作技能：

- `/brainstorming`
- `/writing-plans`
- `/dev-workflow`
- `/plan-persist`
- `/doc-sync`
- `/skill-creator`
- `/harness-setup`
- `/exa-search`

这些 skills 共同覆盖从需求澄清、计划编写、实现、审查到反馈沉淀的完整链路。

### 4. Agent 团队约束

仓库内置了面向 Claude Code 的角色定义：

- Architect
- Developer
- Reviewer
- Tester
- Challenger
- Feedback Curator

这些角色把职责边界、交接格式、阻塞反馈和 memory 更新策略显式写进仓库。

### 5. 会话级 hook

插件会通过多类 hook 持续注入和刷新必要的协作上下文，例如：

- `SessionStart`：注入 `using-brainstorming` 和项目 memory
- `UserPromptSubmit`：显示当前 active plan 与最近 trace
- `PreToolUse`：回注当前 plan，减少执行漂移
- `PostToolUse`：提醒更新 Run Trace / Skill Workflow Record
- `Stop`：提示未关闭的计划步骤或 phase

这样不只减少“新会话忘记规则”，也降低长任务中途偏航的概率。

## 安装

### 作为 Claude Code marketplace 仓库使用

仓库已经包含 Claude Code marketplace 所需清单：

- [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json)
- [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

添加 marketplace：

```bash
/plugin marketplace add https://github.com/HumbleMaxiu/cc-harness.git
```

安装 `cc-harness`：

```bash
/plugin install cc-harness@cc-harness
```

如果你更喜欢先浏览插件列表，也可以先运行 `/plugin`，再在 Discover 里选择 `cc-harness` 安装。

## 启用方式

### 选项 1：仅在当前项目启用

把当前项目的 `.claude/settings.json` 配置为使用插件 hook：

- 示例：[examples/claude-code/project-settings.json](examples/claude-code/project-settings.json)
- 当前仓库默认配置：[.claude/settings.json](.claude/settings.json)

适合只想在单个仓库启用 harness 约束的场景。

### 选项 2：在 Claude Code 全局启用

将同样的 hook 配置写入 `~/.claude/settings.json`：

- 示例：[examples/claude-code/global-settings.json](examples/claude-code/global-settings.json)

适合希望所有 Claude Code 会话默认加载同一套约束的场景。

## 快速开始

典型使用路径：

1. 不知道从哪开始时，先用 `/harness-help` 或 `/harness-guide`
2. 用 `/brainstorming` 澄清需求和设计边界
3. 用 `/writing-plans` 或 `/plan-persist` 建立计划与状态持续化
4. 用 `/dev-workflow` 进入实现、审查、测试和反馈整理流程
5. 交付前运行 `/harness-quality-gate`
6. 完成后把计划移动到 `docs/exec-plans/completed/`

如果你是在一个新项目里引入这套体系，通常从 `/harness-setup` 开始。

如果你想先看一份面向最终用户的入口说明，可以直接读 [docs/guides/harness-guide.md](docs/guides/harness-guide.md)。

`/harness-setup` 现在支持三种 scaffold profile：

- `light`：小项目、低风险、快速起步
- `standard`：默认推荐
- `strict`：高风险、强规范、更强调 gate

如果仓库信号不足，它会默认推荐 `standard`，再由用户确认是否覆盖。

`/dev-workflow` 当前支持三种模式：

- `Skill`：单 agent 串行 workflow，适合小而清楚的任务
- `Subagent`：多角色串行 handoff，适合需要 reviewer / tester 门禁的任务
- `Team`：多 reviewer 并行，适合复杂或多视角审查

如果任务开始时看起来适合 `Skill`，但执行中出现循环审查、高风险工具操作或强状态追踪需求，应升级到 `Subagent` 或 `Team`。

最小示例：

- `Skill`："用 Skill 模式完成这次小范围文档更新，并给出结构化总结"
- `Subagent`："启动完整流程：developer -> reviewer -> tester"
- `Team`："开 3 个 reviewer 并行审查这段改动，然后汇总结论"

## 内置 Skills

| Skill | 用途 |
|------|------|
| `/brainstorming` | 创造性工作前的协作式需求和设计探索 |
| `/writing-plans` | 多步骤任务规格和执行计划编写 |
| `/dev-workflow` | A/Dev/R/T/Feedback Curator 协作流程 |
| `/plan-persist` | 小任务和 bugfix 的轻量 planning 与状态持续化 |
| `/doc-sync` | 代码或流程变更后的文档影响分析与同步 |
| `/harness-help` | 根入口、命令索引和高频场景起点 |
| `/harness-guide` | 根据场景推荐 skill 和 workflow |
| `/harness-audit` | 读取仓库信号并输出 harness 健康检查 |
| `/harness-quality-gate` | 交付前质量门禁 |
| `/feedback` | 用自然语言提交用户反馈 |
| `/skill-creator` | 创建、编辑和改进 Agent Skills |
| `/harness-setup` | 为项目搭建或更新 harness |
| `/exa-search` | 网络、代码和公司研究 |

## Agent 团队

| 角色 | 定义文件 | 职责 |
|------|----------|------|
| Architect | [docs/design-docs/architect.md](docs/design-docs/architect.md) | 任务开始前检查计划，开发完成后维护文档 |
| Developer | [docs/design-docs/developer.md](docs/design-docs/developer.md) | TDD 实现功能 |
| Reviewer | [docs/design-docs/reviewer.md](docs/design-docs/reviewer.md) | 代码质量和安全审查 |
| Tester | [docs/design-docs/tester.md](docs/design-docs/tester.md) | 探测验证入口并执行测试验证 |
| Challenger | [docs/design-docs/challenger.md](docs/design-docs/challenger.md) | 对计划、claim、外部 API 假设做对抗式验证 |
| Feedback Curator | [docs/design-docs/feedback-curator.md](docs/design-docs/feedback-curator.md) | 整理 Agent 反馈、维护 memory、输出自动处理轨迹与最终汇总摘要 |

## 行为规则

### 必须

- 创造性任务先进行头脑风暴，设计批准前不直接进入实现
- 默认采用 TDD
- 编辑源码后同步检查相关文档是否需要更新
- 未经验证不宣称完成

### 禁止

- 禁止 `eval()` / `exec()` 处理用户输入
- 禁止 `shell=True` 传递用户参数
- 禁止 SQL 字符串拼接
- 禁止提交 `.env`、`*.key`、`*.pem`
- 禁止留下死代码或调试输出

### 反馈处理

- 用户反馈优先级最高，直接执行并记录
- Agent 反馈先进入 memory；阻塞反馈默认自动修复回流，非阻塞建议在最终交付时统一汇总
- 同一问题重复出现时，要升级成规则，而不是只记日志

## 持续运行模式

如果你希望 Claude Code 尽量持续运行、减少中途确认，需要同时满足两层条件：

1. **Harness workflow 层**：使用本仓库的 autonomous-until-final-gate 语义，让 Reviewer / Tester 的 `REJECTED` 自动回流修复，而不是中途询问用户。
2. **Claude Code 运行层**：在项目级或全局设置里启用：

```json
{
  "skipDangerousModePermissionPrompt": true
}
```

这项设置只影响 Claude Code 自身的危险模式确认。hook 无法替代产品本身的权限系统，因此如果没有这项设置，workflow 虽然会继续推进，但运行时仍可能因为 Claude Code 默认确认策略而暂停。

## 仓库结构

### 事实来源与镜像

仓库以 `.claude/` 为事实来源。

以下目录必须与 `.claude/` 保持同步：

- [skills](skills/)
- [agents](agents/)
- [scripts/hooks](scripts/hooks/)
- [.codex](.codex/)

另外，hook 声明文件也做三边镜像：

- [hooks/hooks.json](hooks/hooks.json)
- [.claude/hooks/hooks.json](.claude/hooks/hooks.json)
- [.codex/hooks/hooks.json](.codex/hooks/hooks.json)

镜像同步不再只靠手工复制。现在可以运行：

```bash
npm run sync:mirrors
```

它会把 `.claude/skills`、`.claude/agents`、`.claude/scripts/hooks` 同步到根目录和 `.codex/`，并把根目录 `hooks/` 同步到 `.claude/hooks` 与 `.codex/hooks`。

### 主要目录

- [`.claude/`](.claude/)：Claude Code 事实来源
- [`.codex/`](.codex/)：Codex 兼容镜像
- [`skills/`](skills/)：根目录 skills 镜像
- [`agents/`](agents/)：根目录 agents 镜像
- [`scripts/hooks/`](scripts/hooks/)：hook 实现
- [`docs/`](docs/)：设计、规格、执行计划、memory
- [`.claude-plugin/`](.claude-plugin/)：Claude Code marketplace 清单

## 文档导航

| 类别 | 路径 | 内容 |
|------|------|------|
| 设计理念 | [docs/DESIGN.md](docs/DESIGN.md) | 系统设计原则和目标 |
| 路线图 | [docs/PLANS.md](docs/PLANS.md) | 执行阶段和产品路线图 |
| 产品感觉 | [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | 产品为谁服务、什么是“好” |
| 质量评分 | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | 质量维度记分卡 |
| 可靠性 | [docs/RELIABILITY.md](docs/RELIABILITY.md) | 超时、重试、幂等性、observability |
| 安全 | [docs/SECURITY.md](docs/SECURITY.md) | Secrets、auth、audit 预期 |
| 用户指南 | [docs/guides/harness-guide.md](docs/guides/harness-guide.md) | 从哪里开始、如何升级 workflow 与维护 harness |
| Memory | [docs/memory/index.md](docs/memory/index.md) | 项目记忆与反馈索引 |
| 反馈 | [docs/feedback/feedback-collection.md](docs/feedback/feedback-collection.md) | 反馈收集和处理规范 |
| 执行计划 | [docs/exec-plans/index.md](docs/exec-plans/index.md) | 主动执行中的计划 |
| 产品规格 | [docs/product-specs/index.md](docs/product-specs/index.md) | 各领域产品规格文档 |

## 开发与验证

仓库当前内置的自检命令：

```bash
npm test
```

如修改了 `.claude/` 事实源中的 skills / agents / hooks，实现前或提交前建议先运行：

```bash
npm run sync:mirrors
```

它会运行 harness 一致性检查，包括：

- 文档索引链接是否有效
- marketplace 清单是否存在并自洽
- `.claude`、根目录镜像、`.codex` 是否保持一致

## 设计原则

- Markdown-first
- 文档即代码
- Skill 与 Agent 分离
- Hooks 最小化
- 渐进式复杂

更完整的背景见：

- [docs/DESIGN.md](docs/DESIGN.md)
- [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
