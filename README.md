# cc-harness

`cc-harness` 是一个面向 Claude Code 的 harness engineering 插件仓库，提供可复用的 skills、agents、hooks 和 MCP 配置模板。

## 作为 Marketplace 仓库安装

仓库现在包含 Claude Code marketplace 所需的清单文件：

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

添加仓库 marketplace：

```bash
/plugin marketplace add <giturl>
```

添加后即可在 Claude Code 中按插件方式安装 `cc-harness`。

## 启用方式

### 选项 1：仅在当前项目启用

把当前项目的 `.claude/settings.json` 配置为使用插件 hook：

- 现成示例：[`examples/claude-code/project-settings.json`](examples/claude-code/project-settings.json)
- 仓库默认配置：[`.claude/settings.json`](.claude/settings.json)

适合只想在当前仓库启用 harness 约束的场景。

### 选项 2：在 Claude Code 全局启用

将同样的 hook 配置写入 `~/.claude/settings.json`：

- 现成示例：[`examples/claude-code/global-settings.json`](examples/claude-code/global-settings.json)

适合希望所有 Claude Code 会话默认加载 `using-brainstorming` 等约束的场景。

## 目录

- `skills/`：Claude Code skills
- `.claude/agents/`：Claude Code agents
- `hooks/hooks.json`：插件安装后自动发现的 hook 声明
- `scripts/hooks/`：hook 实现
- `docs/`：设计、规格、执行计划与 memory
