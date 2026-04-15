# cc-harness

`cc-harness` 是一个面向 Claude Code 的 harness engineering 插件仓库，帮助项目建立可持续的 AI 协作环境。

它提供一套可复用的：

- skills
- agents
- hooks
- MCP 配置模板
- 文档与 memory 约束

目标不是做一个新的执行引擎，而是把“AI 如何在仓库里协作”这件事产品化、版本化、可审查化。

## 解决什么问题

很多团队已经在用 Claude Code、Codex 或其他 coding agents，但常见问题是：

- 任务开始前没有统一的设计和计划入口
- AI 改完代码后没有稳定的审查和测试闭环
- 反馈只停留在聊天记录里，无法沉淀成规则
- 项目规范散落在多个文件中，新会话难以恢复上下文

`cc-harness` 用 Markdown-first 的方式，把这些约束放进仓库本身：

- 先 brainstorm，再写计划，再实现
- Agent 分工清晰，交接文档固定
- 反馈进入 memory，而不是只留在临时上下文
- 设计、计划、规范和执行状态全部进入 Git

## 核心能力

### 1. Harness 脚手架

通过 `harness-setup` 等 skills，为项目生成或更新：

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/design-docs/`
- `docs/exec-plans/`
- `docs/product-specs/`
- `docs/memory/`

### 2. 结构化开发流程

内置多种协作技能：

- `/brainstorming`
- `/writing-plans`
- `/dev-workflow`
- `/skill-creator`
- `/harness-setup`
- `/exa-search`

这些 skills 共同覆盖从需求澄清、计划编写、实现、审查到反馈沉淀的完整链路。

### 3. Agent 团队约束

仓库内置了面向 Claude Code 的角色定义：

- Architect
- Developer
- Reviewer
- Tester
- Feedback Curator

这些角色把职责边界、交接格式、阻塞反馈和 memory 更新策略显式写进仓库。

### 4. 会话级 hook

插件会通过 SessionStart hook 注入必要的协作上下文，例如：

- `using-brainstorming` skill
- 项目 memory

这样可以减少“新会话忘记规则”的问题。

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

1. 用 `/brainstorming` 澄清需求和设计边界
2. 用 `/writing-plans` 生成执行计划，保存到 `docs/exec-plans/active/`
3. 用 `/dev-workflow` 进入实现、审查、测试和反馈整理流程
4. 完成后把计划移动到 `docs/exec-plans/completed/`

如果你是在一个新项目里引入这套体系，通常从 `/harness-setup` 开始。

## 内置 Skills

| Skill | 用途 |
|------|------|
| `/brainstorming` | 创造性工作前的协作式需求和设计探索 |
| `/writing-plans` | 多步骤任务规格和执行计划编写 |
| `/dev-workflow` | A/Dev/R/T/Feedback Curator 协作流程 |
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
| Memory | [docs/memory/index.md](docs/memory/index.md) | 项目记忆与反馈索引 |
| 反馈 | [docs/feedback/feedback-collection.md](docs/feedback/feedback-collection.md) | 反馈收集和处理规范 |
| 执行计划 | [docs/exec-plans/index.md](docs/exec-plans/index.md) | 主动执行中的计划 |
| 产品规格 | [docs/product-specs/index.md](docs/product-specs/index.md) | 各领域产品规格文档 |

## 开发与验证

仓库当前内置的自检命令：

```bash
npm test
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
