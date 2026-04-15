# Design — cc-harness

## 设计理念

cc-harness 的核心目标是**降低 harness engineering 的使用门槛**，让任何 Claude Code 用户都能快速为自己的项目搭建标准化的 agent 协作环境。

### 系统优化目标

1. **零配置起步** — 用户只需运行 `/harness-setup`，经过少量问答即可生成完整 harness。
2. **渐进式复杂** — 默认 scaffold 提供最小集；随着项目增长，逐步扩展 domains、agents、hooks。
3. **文档即代码** — 所有 harness 文件（AGENTS.md、design-docs、exec-plans）存在于 Git 中，版本化、可 review、可复用。
4. **交接有记录** — Agent 工作流中的每个角色完成后必须输出交接文档，确保上下文不丢失。

### 架构决策

- **Markdown-first** — 所有文档和定义使用 Markdown，无需额外格式或工具。
- **Skill + Agent 分离** — Skill 定义流程编排，Agent 定义角色能力，各自独立、可复用。
- **Hooks 最小化** — 仅在必要时使用 session hooks，避免过度侵入 Claude Code 行为。

### 链接

- 方法论文档：[HARNESS_METHODOLOGY.md](HARNESS_METHODOLOGY.md)
- 设计文档索引：[design-docs/index.md](design-docs/index.md)
- 核心工程信念：[design-docs/core-beliefs.md](design-docs/core-beliefs.md)
