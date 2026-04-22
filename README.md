# cc-harness

`cc-harness` 是一个面向 Claude Code 的 harness engineering 插件仓库，帮助项目建立可持续的 AI 协作环境。

它提供一套可复用的：

- skills
- agents
- hooks
- MCP 配置模板
- 文档与 memory 约束

目标不是做一个新的执行引擎，而是把“AI 如何在仓库里协作”这件事产品化、版本化、可审查化。

如果你想先理解这个仓库的定位、结构和 roadmap，可以先读 [docs/guides/project-overview.md](docs/guides/project-overview.md)。如果你想直接上手使用，继续看这份 README 就可以。

## 这份 README 适合谁

这份文档主要写给三类用户：

- 第一次通过 `/plugin install` 安装 `cc-harness` 的用户
- 想在自己的项目里初始化 harness 文档和 workflow 的用户
- 已经在使用 `cc-harness`，想知道该调用哪个 skill、自动化会做什么、出错时怎么处理的用户

## 核心痛点与当前解法

`cc-harness` 主要解决下面这些高频问题：

| 问题 | 当前解法 |
|------|----------|
| 先写代码后思考 | `/brainstorming` + `/writing-plans` + `AGENTS.md` hard gate |
| 计划漂移 | `docs/exec-plans/active/` + Run Trace + `/plan-persist` + planning hooks |
| 验证缺失 | `/dev-workflow` + Reviewer / Tester / Challenger + `/harness-quality-gate` |
| 文档腐坏 | `/doc-sync` + index + consistency checks |
| 反馈无法沉淀 | `/feedback` + feedback memory + recurrence + skill promotion path |
| 恢复困难 | SessionStart memory 注入 + memory / plan / trace 回注 |

`/harness-setup` 现在支持三种 scaffold profile，分别面向轻量起步、默认标准和高约束场景。

## 安装与启用

### 1. 添加 marketplace

仓库已经包含 Claude Code marketplace 所需清单：

- [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json)
- [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

添加 marketplace：

```bash
/plugin marketplace add https://github.com/HumbleMaxiu/cc-harness.git
```

### 2. 安装插件

```bash
/plugin install cc-harness@cc-harness
```

如果你更喜欢先浏览插件列表，也可以先运行 `/plugin`，再在 Discover 里选择 `cc-harness` 安装。

### 3. hooks 自动加载行为

对于 **Claude Code v2.1+**，安装后的插件会按约定自动加载 [hooks/hooks.json](hooks/hooks.json)。

这意味着：

- 一般 **不需要** 再手动把 hooks 写进 `.claude/settings.json`
- 也 **不要** 在 plugin manifest 里显式声明 hooks 文件
- 如果你手动再写一遍相同 hooks，可能会遇到重复检测错误

`cc-harness` 当前随插件提供的 hooks 包括：

- `SessionStart`：注入 `using-brainstorming` 和最小 memory 快照
- `UserPromptSubmit`：显示当前 active plan 状态
- `PreToolUse`：工具执行前刷新 plan / trace 锚点
- `PostToolUse`：写入后提醒更新 Run Trace / Workflow Record
- `Stop`：退出前检查 active plan 是否仍有未完成项

换句话说，**插件安装后，默认应该拿到的是整套 hooks，不只是 SessionStart。**

### 4. 可选 settings

虽然 hooks 通常会自动加载，但你仍然可以配置其他 Claude Code settings。最常见的是：

- `skipDangerousModePermissionPrompt`

项目级示例：

- [examples/claude-code/project-settings.json](examples/claude-code/project-settings.json)

全局示例：

- [examples/claude-code/global-settings.json](examples/claude-code/global-settings.json)

如果你只是想减少危险模式确认，一个最小配置可以是：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "skipDangerousModePermissionPrompt": true
}
```

### 5. 什么情况下还需要手动配置 hooks

只有在下面这些情况，才建议手动检查或合并 hooks：

- Claude Code 版本较旧，不支持插件 hooks 自动加载
- 当前环境没有按约定自动加载 `hooks/hooks.json`
- 你明确要做本地调试、定制或兼容特殊运行环境

如果你手动配置 hooks，先检查当前是否已经自动加载，避免重复声明。

## 第一次使用：推荐起手路径

如果你是第一次接触 `cc-harness`，最稳的路径是：

1. 用 `/harness-setup` 初始化项目文档骨架和 harness 结构
2. 用 `/harness-help` 或 `/harness-guide` 了解入口
3. 新功能先走 `/brainstorming`，再走 `/writing-plans`
4. 实现阶段进入 `/dev-workflow`
5. 如有文档影响，用 `/doc-sync`
6. 交付前运行 `/harness-quality-gate`
7. 过程中如果对体验、流程或规范有意见，用 `/feedback`

进入 `Subagent` 模式时，空返回或无效 handoff 不能被当作通过；同时不要把全量文件列表和重复规则直接塞进 subagent prompt。

## 详细使用步骤

### 场景 1：初始化一个新项目

第一次在项目中引入 harness，推荐顺序：

1. 运行 `/harness-setup`
2. 让它检测仓库类型、技术栈和推荐 profile
3. 确认 scaffold profile：
   - `light`：小项目、低风险、快速起步
   - `standard`：默认推荐
   - `strict`：高风险、强规范、更强调 gate
4. 生成基础结构：
   - `AGENTS.md`
   - `ARCHITECTURE.md`
   - `docs/design-docs/`
   - `docs/exec-plans/`
   - `docs/product-specs/`
   - `docs/memory/`
   - `docs/feedback/`
5. 之后再根据实际任务进入开发 workflow

如果项目里已经有完整 harness，而你只是想补一个 domain、design doc 或执行计划，优先做 update，不要重新 scaffold。

### 场景 2：开发一个新功能

推荐顺序：

1. 找到或补齐对应的 `docs/product-specs/<domain>.md`
2. 如果需求或方案还不清楚，先运行 `/brainstorming`
3. 如果任务有多个步骤，运行 `/writing-plans`
4. 执行实现时进入 `/dev-workflow`
5. 如果改动影响文档、导航、规范或索引，运行 `/doc-sync`
6. 收尾前运行 `/harness-quality-gate`
7. 计划完成后，把执行计划移动到 `docs/exec-plans/completed/`

最短示例：

```text
/brainstorming
/writing-plans
/dev-workflow
/doc-sync
/harness-quality-gate
```

### 场景 3：修 bug 或做小改动

如果是 bugfix 或边界清楚的小任务：

1. 先看 `docs/RELIABILITY.md` 和 `docs/SECURITY.md`
2. 小任务可先用 `/plan-persist`
3. 实现时进入 `/dev-workflow`
4. 如影响 docs，再做 `/doc-sync`
5. 最后跑 `/harness-quality-gate`

### 场景 4：提反馈或查询反馈

当你想直接对当前项目或 workflow 提意见时：

- 用 `/feedback`

当你想查询历史反馈、summary、recurrence 或 skill 候选时：

- 用 `/feedback-query`

推荐理解方式：

- `/feedback` 负责“提 + 分诊”
- `/feedback-query` 负责“查”

## Skill 选择指南

下面这张表是最实用的部分：什么时候该调什么 skill。

| Skill | 功能 | 什么时候调 |
|------|------|------------|
| `/harness-setup` | 初始化或更新 harness 文档骨架 | 新项目首次引入 harness，或现有项目需要补齐基础结构 |
| `/harness-help` | 显示命令索引、根入口和常见场景 | 不知道从哪里开始，想先看入口 |
| `/harness-guide` | 根据场景推荐 skill / workflow | 知道自己要做什么，但不确定该走哪条流程 |
| `/brainstorming` | 需求和设计探索 | 新功能、交互变化、架构想法、需求还不清楚时 |
| `/writing-plans` | 多步骤任务规划 | 任务复杂、需要范围、顺序和验收标准时 |
| `/plan-persist` | 轻量 planning 和状态持续化 | 小任务、bugfix、探索任务、`/compact` 前后恢复 |
| `/dev-workflow` | 实现、审查、测试、反馈整理 | 计划已清楚，准备进入执行闭环 |
| `/doc-sync` | 文档影响分析与同步 | 改了代码、配置、workflow、agent、docs 索引时 |
| `/harness-audit` | 检查 harness 健康状态 | 想看当前 harness 缺口和下一轮补齐优先级时 |
| `/harness-quality-gate` | 交付前质量门禁 | 准备提交、交付、结束一个阶段时 |
| `/feedback` | 分诊并提交反馈 | 想提意见、纠正流程、记录体验问题或长期偏好时 |
| `/feedback-query` | 查询反馈历史和 recurrence | 想回看反馈、做 summary、看 skill candidate 时 |
| `/skill-creator` | 创建或改进 skill | 已经明确要把 recurring workflow 升级成 skill 时 |
| `/exa-search` | 通过 Exa 做研究 | 需要网页、代码、公司、人物等外部研究时 |

## Agent 团队做什么

`cc-harness` 内置了下面这些角色：

| 角色 | 职责 |
|------|------|
| Architect | 计划检查、docs impact 判断、触发文档同步 |
| Developer | TDD 实现 |
| Reviewer | 代码质量和安全审查 |
| Tester | 探测验证入口并执行测试验证 |
| Challenger | 对 plan、claim、API 假设和完成声明做对抗式验证 |
| Feedback Curator | 整理 feedback、维护 memory、输出自动处理摘要 |

通常你不需要手工一个个调用这些角色；更常见的做法是通过 `/dev-workflow` 进入完整流程。

## 自动化会做什么

`cc-harness` 的自动化重点是“持续提醒、状态回注、低风险回流”，而不是无条件替你做所有决策。

### 自动化会做的事情

- SessionStart 注入 `using-brainstorming` 和最小 memory 快照
- 在执行前后回注 plan、Run Trace、feedback 和 drift signals
- 在 `/dev-workflow` 中自动处理低风险阻塞反馈回流
- 在有 `Feedback Record` 时触发 `feedback-curator` 维护 feedback memory
- 在 Skill 模式中保留 `Doc Sync` 阶段，提醒同步文档和导航
- 在质量门禁阶段集中检查验证、文档同步和剩余风险

### 自动化收口规则

低风险反馈会自动回流修复的典型情况：

- `risk_level=low`
- `operation_risk` 不高于 `reversible-write`
- `action_type` 属于自动执行白名单：
  - `code_fix`
  - `test_fix`
  - `doc_sync`

### 自动化不会替你做的事情

下面这些不会被静默自动执行：

- 删除文件
- 迁移脚本
- 发布 / 部署
- 权限或网络相关变更
- `irreversible-write`
- `external-side-effect`
- workflow 规则级或 repo 规则级修改

这类场景需要显式 gate 或最终确认，不能靠自动化默默推进。

## 文档会如何自动维护

`cc-harness` 不承诺“你一改代码，所有文档自动完美更新”，但它会尽量把文档维护收进 workflow：

- Skill 模式中包含 `Doc Sync` 阶段
- `/doc-sync` 专门负责文档影响分析、索引同步和导航补齐
- 编辑源码后，规范要求同步检查 docs 是否受影响
- `feedback-curator` 会把 feedback 逐步沉淀到 memory / prevents-recurrence

你可以把它理解为：

- 文档维护有专门入口和阶段
- 系统会提醒和收口
- 但仍需要 agent 按契约执行，而不是指望魔法自动全改完

## `.mcp.json` 模板与 MCP 使用方式

`cc-harness` 仓库根目录提供了一份 [`.mcp.json`](.mcp.json) 模板。

**重要：** `/plugin install cc-harness@cc-harness` 不会自动把这份 `.mcp.json` 注册到你的 Claude Code 配置里。当前它是模板，不是自动安装项。

如果你想使用这些 MCP，可以在你自己的项目根目录手动创建 `.mcp.json`，例如：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github@2025.4.8"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@2.1.4"]
    },
    "exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp"
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory@2026.1.26"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@0.0.69", "--extension"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@2025.12.18"]
    }
  }
}
```

建议：

- 把它当作模板，自行按项目需要删减
- 认证信息通过 Claude Code secrets 或环境变量管理
- 并不是所有 skill 都要求所有 MCP 都启用
- 某些 skill 会显式要求对应 MCP，例如 `exa-search`

## 给 AI 的配置提示词

如果你更希望让 AI 帮你检查和配置，可以把下面这段提示词直接发给 Claude Code / Codex：

```text
请帮我检查当前项目里的 cc-harness 插件配置，并按下面要求处理：

1. 先确认我是否已经安装了 cc-harness 插件。
2. 检查当前 Claude Code 环境是否已经自动加载 cc-harness 的 hooks/hooks.json。
3. 如果 hooks 已自动加载，不要重复把同样的 hooks 写进 settings。
4. 如果 hooks 没有自动加载，再告诉我缺了哪些 hook，并给出最小修复方案。
5. 如果项目根目录没有 .mcp.json，请基于 cc-harness 仓库中的模板创建一个 .mcp.json。
6. 创建 .mcp.json 时保留以下 MCP：
   - github
   - context7
   - exa
   - memory
   - playwright
   - sequential-thinking
7. 如果发现某些 MCP 需要额外认证、环境变量或 secrets，请明确列出来，但不要伪造凭据。
8. 最后给我一个结果总结：
   - hooks 是否已自动加载
   - 是否修改了 settings
   - 是否创建或更新了 .mcp.json
   - 还有哪些步骤需要我手动完成
```

这个提示词的核心目的是：

- 先判断 hooks 是否已经自动加载
- 避免重复写入 hooks
- 让 AI 在需要时帮你生成 `.mcp.json`

## plugin install 常见问题

### 1. `/plugin install` 成功了，但 hooks 没生效

最常见原因：

- Claude Code 当前环境没有自动加载插件的 `hooks/hooks.json`
- Claude Code 版本较旧，或运行环境不支持插件 hooks 自动加载
- 本地又手动声明了一份重复 hooks，导致冲突
- 插件根目录解析异常，导致 hook runner 找不到实际脚本

检查方式：

1. 先确认当前环境是否应该自动加载插件 hooks
2. 检查 [hooks/hooks.json](hooks/hooks.json) 中的 5 个 hooks 是否都应生效
3. 新开一个会话，看是否注入了 memory / using-brainstorming
4. 检查是否存在重复声明的 hooks 配置
5. 必要时再手动合并 hooks，而不是先复制一份 SessionStart 配置

### 2. marketplace 添加或安装失败

优先检查：

1. Git URL 是否正确：
   - `https://github.com/HumbleMaxiu/cc-harness.git`
2. 网络是否可访问 GitHub
3. Claude Code 当前版本是否支持 marketplace git 安装
4. 重新执行：

```bash
/plugin marketplace add https://github.com/HumbleMaxiu/cc-harness.git
/plugin install cc-harness@cc-harness
```

### 3. 安装后没有 `.mcp.json` 里的 MCP

这是当前设计预期，不是安装失败。

原因：

- plugin manifest 当前只声明了 skills / agents
- `.mcp.json` 只是模板，不会随 `/plugin install` 自动注册

处理方式：

- 在你自己的项目里手动创建 `.mcp.json`
- 或把模板内容合并到你现有的 MCP 配置中
- 也可以把上面的“给 AI 的配置提示词”直接发给 AI，让它帮你检查并生成模板

## 日常开发常见问题

### 1. 不知道该从哪里开始

先用：

```text
/harness-help
```

如果你知道任务场景，但不确定具体 skill，再用：

```text
/harness-guide
```

### 2. 新功能要不要先写代码

不要直接跳实现。推荐顺序：

```text
/brainstorming
/writing-plans
/dev-workflow
```

### 3. Reviewer / Tester 给出问题后会怎样

默认流程是：

- 先记录 feedback
- 低风险阻塞项自动回流修复
- 非阻塞建议在最终交付前统一汇总
- 高风险动作不会静默自动执行

### 4. 文档没有同步怎么办

优先用：

```text
/doc-sync
```

如果你已经在 `/dev-workflow` 中，也要检查本轮任务是否已经进入 `Doc Sync` 阶段。

### 5. feedback 没有沉淀成长期约束怎么办

检查这几处：

- [docs/memory/index.md](docs/memory/index.md)
- [docs/memory/feedback/user-feedback.md](docs/memory/feedback/user-feedback.md)
- [docs/memory/feedback/agent-feedback.md](docs/memory/feedback/agent-feedback.md)
- [docs/memory/feedback/prevents-recurrence.md](docs/memory/feedback/prevents-recurrence.md)

原则是：

- 用户反馈优先进入 `user-feedback.md`
- Agent 反馈进入 `agent-feedback.md`
- 重复问题升级到 `prevents-recurrence.md`

### 6. `.claude/`、根目录镜像、`.codex/` 不一致怎么办

先不要为了通过检查直接同步覆盖。

推荐顺序：

1. 先看 diff，确认哪一侧才是最新事实来源
2. 需要时手动合并
3. 再运行：

```bash
npm run sync:mirrors
```

不要把“让检查通过”当作直接覆盖镜像的充分理由。

## 自检与维护命令

常用命令：

```bash
npm run sync:mirrors
npm run check:harness
npm run check:smoke
npm test
```

含义：

- `npm run sync:mirrors`：同步 `.claude/` 到根目录与 `.codex/`
- `npm run check:harness`：运行 harness 一致性检查
- `npm run check:smoke`：跑新仓库 smoke 检查
- `npm test`：运行 consistency + evals + behavior evals

## 仓库结构

### 事实来源与镜像

仓库以 `.claude/` 为事实来源。

以下目录必须与 `.claude/` 保持同步：

- [skills](skills/)
- [agents](agents/)
- [scripts/hooks](scripts/hooks/)
- [.codex](.codex/)

其中 `agents` 有一个格式例外：

- `.claude/agents/*.md` 是事实来源
- `agents/*.md` 是根目录 Markdown 镜像
- `.codex/agents/*.toml` 是由 `npm run sync:mirrors` 生成的 Codex 原生 subagent 配置，不再镜像 `.md`

另外，hook 声明文件分两种运行层表示：

- [hooks/hooks.json](hooks/hooks.json)
- [.claude/hooks/hooks.json](.claude/hooks/hooks.json)
- [.codex/hooks.json](.codex/hooks.json)

其中 Codex 还需要项目级 [`.codex/config.toml`](.codex/config.toml) 显式打开 `codex_hooks = true`。

当前 Codex hooks 与 Claude hooks 分开维护，不再从 Claude hook runner 自动镜像生成。Codex 已单独实现 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop` 五类 hooks，统一使用 git-root-based 命令路径，并按 Codex 官方协议返回原生 JSON 输出：`SessionStart` / `UserPromptSubmit` 通过 `additionalContext` 注入上下文，`PreToolUse` / `PostToolUse` / `Stop` 通过 `systemMessage` 给出提醒，避免再走 Claude 风格的 stdout 文本拼接。

如果你需要排查 Codex hook 运行过程，可通过 [`.codex/hook-logging.json`](.codex/hook-logging.json) 控制文件日志。当前仓库默认开启，并把关键节点日志写到 `.codex/logs/hooks.log`；如需临时覆盖路径，仍可设置 `CC_HARNESS_HOOK_LOG_PATH`。

如果你需要排查 Claude Code hook 运行过程，可通过 [`.claude/hook-logging.json`](.claude/hook-logging.json) 控制文件日志。当前仓库默认开启，并把 `run-with-flags`、`plan-write-reminder`、`plan-stop-check` 和 `session-start-bootstrap` 的关键节点日志写到 `.claude/logs/hooks.log`；如需临时覆盖路径，仍可设置 `CC_HARNESS_HOOK_LOG_PATH`。

### 主要目录

- [`.claude/`](.claude/)：Claude Code 事实来源
- [`.codex/`](.codex/)：Codex 运行层镜像；其中 agents 使用 `.toml`
- [`skills/`](skills/)：根目录 skills 镜像
- [`agents/`](agents/)：根目录 agents 镜像
- [`scripts/hooks/`](scripts/hooks/)：hook 实现
- [`docs/`](docs/)：设计、规格、执行计划、memory
- [`.claude-plugin/`](.claude-plugin/)：Claude Code marketplace 清单

## 延伸阅读

| 文档 | 作用 |
|------|------|
| [docs/guides/project-overview.md](docs/guides/project-overview.md) | 项目介绍、能力地图、流程图和 roadmap |
| [docs/guides/harness-guide.md](docs/guides/harness-guide.md) | 场景化使用指南 |
| [docs/DESIGN.md](docs/DESIGN.md) | 系统设计原则 |
| [docs/PLANS.md](docs/PLANS.md) | 产品路线图 |
| [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | 产品为谁服务、什么是“好” |
| [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | 质量维度记分卡 |
| [docs/RELIABILITY.md](docs/RELIABILITY.md) | 超时、重试、幂等性、observability |
| [docs/SECURITY.md](docs/SECURITY.md) | 安全边界和约束 |
| [docs/memory/index.md](docs/memory/index.md) | 记忆入口 |

## 设计原则

- Markdown-first
- 文档即代码
- Skill 与 Agent 分离
- Hooks 最小化
- 渐进式复杂
