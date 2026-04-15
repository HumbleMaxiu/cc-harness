# Claude Marketplace Install Plan

**日期：** 2026-04-15
**状态：** COMPLETED

## 目标

将 `cc-harness` 调整为可被 Claude Code 通过 `/plugin marketplace add <giturl>` 发现和安装的仓库形态，并提供：

- 当前项目启用方案
- Claude Code 全局启用方案

## 背景

仓库中已有早期插件元数据，但仍存在以下问题：

- `.claude-plugin/plugin.json` 仍是旧字段形态，未声明 agents/skills/commands
- marketplace 元数据位于仓库根目录，且内容已经过时
- hook bootstrap 仍使用 `ecc` / `everything-claude-code` 旧 slug 解析插件根目录
- 仓库缺少一份面向使用者的安装说明，无法清晰区分项目级与全局级配置

## 实施结果

1. 将 Claude Code 插件清单升级为安装型 manifest：
   - `.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json`
2. 将 hook 根目录解析逻辑切换到 `cc-harness`，并保留旧 slug 兼容路径
3. 补充安装文档：
   - 通过 git URL 添加 marketplace
   - 项目级 settings
   - 全局级 settings
4. 更新架构/规格文档和一致性检查，避免文档与实现继续漂移

## 受影响文件

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `scripts/hooks/*.js`
- `.claude/scripts/hooks/*.js`
- `.codex/scripts/hooks/*.js`
- `README.md`
- `ARCHITECTURE.md`
- `docs/product-specs/skill-system.md`
- `docs/generated/index.md`
- `docs/SECURITY.md`
- `scripts/checks/harness-consistency.js`

## 验证

- `npm test`
- 手动核对安装文档中的项目级与全局级配置路径
