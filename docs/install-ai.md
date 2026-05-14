# 面向 AI 的安装说明

这份文档写给 AI coding agent。如果用户把这份文件交给你，并要求安装 `cc-harness`，请严格按以下步骤执行。

## 目标

把仓库中的 source skills 和 hooks 安装到目标项目，支持 Claude Code、Codex 或两者同时安装。

source 仓库不保存已提交的 runtime folders。必须运行安装器，由安装器在目标项目中生成 host-specific runtime files。

## 前置条件

- 本地已有 `cc-harness` checkout
- 可以通过 `node` 使用 Node.js
- 已知目标项目路径
- 对目标项目有写入权限

## 命令

在 `cc-harness` checkout 中运行：

```bash
./install.sh --target both --dest /path/to/target/project
```

如果用户只要求安装某个 host，使用更窄的 target：

```bash
./install.sh --target claude-code --dest /path/to/target/project
./install.sh --target codex --dest /path/to/target/project
```

## 预期生成文件

Claude Code：

```text
<target>/.claude/skills/
<target>/.claude/scripts/hooks/
<target>/.claude/package.json
<target>/.claude/settings.json
<target>/.claude/hook-logging.json
```

Codex：

```text
<target>/.codex/skills/
<target>/.codex/scripts/hooks/
<target>/.codex/package.json
<target>/.codex/config.toml
<target>/.codex/hooks.json
<target>/.codex/hook-logging.json
```

## 验证

安装后，确认生成文件存在：

```bash
test -f /path/to/target/project/.claude/settings.json || true
test -f /path/to/target/project/.codex/hooks.json || true
```

当前 source checkout 没有 repo-local npm test/check script。请使用上面的 install smoke checks 作为验证路径。

## 规则

- 不要从旧 commit 复制已删除的 repository mirror directories。
- 不要在仓库级别重新创建 `.claude`、`.codex`、`.claude-plugin`、`examples`、`fixtures` 或 `agents` 目录。
- Runtime folders 只应出现在目标项目中。
- 如果目标项目已有 host config，保留无关设置，只合并 `cc-harness` hook entries。
