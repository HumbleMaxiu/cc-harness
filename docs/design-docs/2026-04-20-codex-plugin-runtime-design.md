# Codex Plugin And Runtime Support 设计文档

> **状态**：拟实施
> **日期**：2026-04-20

## 目标

为 `cc-harness` 新增面向 Codex 的正式安装与启用路径，让用户既可以：

1. 通过 Codex plugin 安装可被官方插件系统直接分发的内容
2. 在项目内启用 `cc-harness` 的完整 Codex 运行能力，包括 hooks、subagents、MCP 和项目级约束

本次设计的核心不是“只补一个 manifest”，而是把 Codex 的插件层与运行层清晰拆开，避免用户误以为“插件已安装”就等于“全部能力已生效”。

## 背景

当前仓库已经维护了 `.codex/` 镜像目录，但它主要是对 `.claude/` 事实源的兼容镜像，尚未完整对齐 Codex 官方推荐的分层方式。

现状中的主要问题：

- README 的安装叙事几乎全部围绕 Claude Code plugin
- `.codex/` 中已有 skills、hooks、scripts 和 agents 镜像，但缺少正式的 Codex plugin 入口
- Codex 官方 plugin 只原生支持 `skills/`、`.mcp.json`、`.app.json` 与 manifest 元数据，不直接承载 hooks 或 subagents
- Codex 的 hooks、MCP 和 subagents 依赖 `.codex/config.toml`、`.codex/hooks.json`、`.codex/agents/*.toml` 等运行层文件，当前仓库尚未把这套启用路径讲清楚

## 官方能力边界

根据 OpenAI Codex 官方文档：

- plugin 支持在 `.codex-plugin/plugin.json` 中声明 `skills`、`mcpServers`、`apps`
- hooks 通过 `~/.codex/hooks.json` 或 `<repo>/.codex/hooks.json` 被发现，并且需要在 `config.toml` 中打开 `codex_hooks`
- MCP 可以通过 `codex mcp add` 或 `~/.codex/config.toml` / `.codex/config.toml` 配置
- subagents 使用 `.codex/agents/*.toml`

这意味着：

- **plugin 负责“可安装包”**
- **`.codex/` 负责“项目运行时”**

二者互补，但不是同一层。

## 设计原则

### 1. 用户体验分层明确

对外文档必须区分两类动作：

- **安装插件**：拿到可分发的 skills 和 MCP 配置
- **启用完整模式**：让仓库中的 hooks、subagents 和项目级 Codex config 也生效

### 2. 尽量复用现有资产

继续以现有仓库内容为基础，不重写核心 skill/hook 逻辑。新增 Codex 支持时优先复用：

- `skills/`
- `scripts/hooks/`
- `.codex/`
- 现有 mirror sync 机制

### 3. 不伪造官方未承诺的安装语义

既然 Codex 官方 plugin 文档没有把 hooks 和 subagents 作为 plugin manifest 的一等字段，就不在对外文档中声称“安装插件即可自动拿到 hooks 和 agents 全能力”。

### 4. 仓库内 Codex 资产要逐步原生化

`.codex/` 不应长期只是 Claude 镜像。至少需要补齐 Codex 当前约定下的：

- `.codex/config.toml`
- `.codex/hooks.json`
- `.codex/agents/*.toml`

## 用户可见方案

### 路径 A：安装 Codex plugin

仓库提供一个 repo-local Codex plugin：

- `plugins/cc-harness/.codex-plugin/plugin.json`
- `plugins/cc-harness/skills/`
- `plugins/cc-harness/.mcp.json`
- `.agents/plugins/marketplace.json`

这个路径用于满足：

- 在 Codex 中发现并安装 `cc-harness`
- 获取 plugin 打包的 skills
- 获取推荐的 MCP 配置入口

### 路径 B：启用项目级完整模式

仓库根目录提供 Codex 原生运行时配置：

- `.codex/config.toml`
- `.codex/hooks.json`
- `.codex/agents/*.toml`

这个路径用于满足：

- hooks 自动参与 Codex 生命周期
- subagents 能以 Codex 原生格式被使用
- MCP / agents / feature flags / project config 在 Codex 中按项目生效

### 推荐叙事

README 中推荐用户按两步走：

1. 安装 `cc-harness` Codex plugin
2. 在项目中启用 `cc-harness` 的完整 Codex 运行层

如果用户只做第一步，应明确告诉他们：

- skills 和 MCP 模板可用
- hooks 和 subagents 不一定自动生效

## 文件设计

### 1. Codex plugin 目录

新增：

- `plugins/cc-harness/.codex-plugin/plugin.json`
- `plugins/cc-harness/skills/`
- `plugins/cc-harness/.mcp.json`

必要时补：

- `plugins/cc-harness/assets/`

插件内的 `skills/` 使用仓库已有 skills 的稳定镜像，而不是重新撰写一套内容。

### 2. Marketplace 清单

新增：

- `.agents/plugins/marketplace.json`

用于让本仓库可以作为 Codex plugin marketplace 的本地或仓库来源。

### 3. Codex 运行层配置

新增或调整：

- `.codex/config.toml`
- `.codex/hooks.json`
- `.codex/agents/*.toml`

其中：

- `config.toml` 负责 feature flag、MCP、agents 上限等 Codex 原生配置
- `hooks.json` 负责 hook 声明
- `agents/*.toml` 负责 Codex subagent 定义

### 4. 与现有镜像机制的关系

现有 `scripts/sync/mirror-claude-artifacts.js` 只处理 `.claude/`、根目录镜像和 `.codex/` 的同步。

本次设计不要求 plugin 目录成为新的事实源，但需要明确：

- plugin 内 skills 来自受控镜像或同步产物
- `.codex/agents/*.toml` 与现有 markdown agents 的关系要被文档化
- consistency check 应覆盖新的 Codex plugin 入口

## Agent 表达形式

当前仓库中的 agents 主要以 markdown 文档存在，适合 Claude Code 叙事和项目设计文档导航。

Codex subagents 官方格式为 TOML，因此本次采用“双表示层”：

- 保留现有 `agents/*.md` 与 `.claude/agents/*.md` 作为人类可读和 Claude 兼容描述
- 为 Codex 运行层新增 `.codex/agents/*.toml`

这两者不是简单一比一镜像：

- markdown 负责职责说明与导航
- TOML 负责 Codex 可执行配置

README 必须明确这一点，避免用户误以为 `.md` agent 会被 Codex 当成 subagent 直接加载。

## Hooks 设计

Codex hooks 使用 `.codex/hooks.json`，不再依赖 `hooks/hooks.json` 的 Claude plugin 自动加载语义。

本次需要把现有 hook 脚本接到 Codex hooks 声明中，并在 `.codex/config.toml` 中显式打开：

```toml
[features]
codex_hooks = true
```

原则上：

- 继续复用现有 `scripts/hooks/*.js`
- 优先让 `.codex/hooks.json` 指向仓库内稳定路径
- 不承诺跨平台能力超出 Codex hooks 当前官方边界

## MCP 设计

Codex plugin 中可以携带 `.mcp.json`，但项目级完整能力仍需要 `.codex/config.toml` 或 `codex mcp` 配置配合。

因此 MCP 采取双入口：

- plugin 内：提供推荐 MCP 清单
- 项目内：提供如何让 Codex 真正连上这些 MCP 的说明

对于需要认证的 MCP，应在 README 中列出：

- 所需环境变量或 secrets
- 哪些是可选 MCP
- 哪些 skill 依赖哪些 MCP

## 文档与检查

需要同步更新：

- `README.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product-specs/agent-system.md`
- `docs/product-specs/mcp-integration.md`
- 视情况补一份 Codex plugin / runtime 相关产品规格

一致性检查至少补充：

- Codex plugin manifest 存在且路径有效
- plugin 的 `skills` / `.mcp.json` 引用有效
- `.agents/plugins/marketplace.json` 存在且指向正确 plugin 路径
- `.codex/config.toml`、`.codex/hooks.json`、`.codex/agents/*.toml` 存在并满足最小结构

## 风险与取舍

### 1. “插件安装”与“完整启用”分两步，叙事更复杂

这是必要复杂度。因为如果文档把两者混为一谈，用户安装后发现 hooks 或 subagents 没生效，会直接削弱对 harness 的信任。

### 2. Codex agents 需要 TOML，和现有 markdown agents 双轨维护

这是额外维护成本，但它换来的是：

- 对 Codex 官方格式的真实支持
- 对人类文档导航的保留

### 3. mirror sync 需要后续扩展

短期可以先手动维护 plugin 目录或增加最小同步逻辑；长期更合理的是把 plugin 产物也纳入自动同步/检查体系。

## 验收标准

完成后应满足：

1. 仓库存在可被 Codex 识别的 plugin 目录与 manifest
2. 用户可按 README 在 Codex 中安装该 plugin
3. 仓库存在项目级 `.codex/config.toml`、`.codex/hooks.json` 与 `.codex/agents/*.toml`
4. README 能清楚解释“安装插件”和“启用完整模式”的区别
5. `check:harness` 或等价检查能够发现 Codex plugin/runtime 关键缺口
6. 现有 Claude 路径不被破坏

## 结论

本次 Codex 支持应被实现为：

- **一个可安装的 Codex plugin**
- **一个可启用的项目级 Codex runtime**
- **一套清晰说明两者关系的用户文档**

只有这样，`cc-harness` 才能在 Codex 里既“装得上”，又“真正跑得起来”。
