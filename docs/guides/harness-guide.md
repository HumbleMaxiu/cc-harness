# Harness Guide

> 面向最终用户的简明指南：什么时候开始、用哪条 workflow、什么时候需要更强约束。

## 什么时候从 `/harness-setup` 开始

从 `/harness-setup` 开始的典型场景：

- 你正在一个新仓库里首次引入 harness
- 仓库里已有零散文档，但没有统一的 `AGENTS.md`、`docs/`、memory / feedback 结构
- 你想把现有项目升级成更稳定的 agent 协作环境

如果仓库已经有完整 harness，而你只是补一个 domain、design doc 或执行计划，优先用 `harness update`，而不是重新 scaffold。

## 先选合适的 profile

`/harness-setup` 会推荐一个 scaffold profile：

- `light`：小项目、低风险、快速起步
- `standard`：默认推荐，适合大多数团队项目
- `strict`：高风险、强规范、更强调 gate、验证和恢复

什么时候考虑升级到 `strict`：

- 仓库涉及部署、权限、认证、支付、生产数据或其他敏感边界
- 你希望 reviewer / tester / risk gate 更明确
- 你更在意审计性，而不是最轻量的起步体验

如果不确定，先用 `standard`，后续再升级通常比一开始过度框架化更稳。

## 日常工作流怎么走

### 新功能

1. 先看对应的 `docs/product-specs/<domain>.md`
2. 如果问题有探索性，先用 `/brainstorming`
3. 需要多步骤落地时，用 `/writing-plans` 写到 `docs/exec-plans/active/`
4. 实现时进入 `/dev-workflow`

### Bug 修复

1. 先看 `docs/RELIABILITY.md` 和 `docs/SECURITY.md`
2. 用 `/writing-plans` 或直接进入 `/dev-workflow`
3. 修复后回看 `docs/QUALITY_SCORE.md` 是否需要更新

### 架构或规范变更

1. 先看 `ARCHITECTURE.md`
2. 新建设计文档到 `docs/design-docs/`
3. 再进入实现和验证流程

## 什么时候用 `/brainstorming`、`/writing-plans`、`/dev-workflow`

- `/brainstorming`
  - 需求还不清楚
  - 方案有多种可能
  - 不想直接跳进实现
- `/writing-plans`
  - 任务有多个步骤
  - 需要把范围、顺序、验收标准写清楚
  - 希望后续恢复时有稳定事实来源
- `/dev-workflow`
  - 计划和输入已经足够清楚
  - 要开始实现、审查、验证和文档同步
- `/doc-sync`
  - 已经完成代码、配置、workflow 或 agent 变更
  - 需要显式同步相关 docs、index、导航
  - 想把文档维护从实现步骤里拆开单独做

## 轻量路径 vs 增强路径

### 小项目轻量用法

- 用 `light` 或 `standard`
- 能用 `Skill` 模式闭环就不要急着上多 agent
- 保持 docs 骨架简洁，先把 `AGENTS.md`、`docs/product-specs/`、`docs/exec-plans/` 跑顺

### 复杂项目增强用法

- 选 `standard` 或 `strict`
- 创造性或高风险任务先走 `/brainstorming` + `/writing-plans`
- 在 `/dev-workflow` 中根据复杂度升级到 `Subagent` 或 `Team`
- 对高风险动作使用显式 gate，不要把确认埋在长对话里

## docs / memory / feedback 怎么维护

### docs

- 新增 design doc 后，更新 `docs/design-docs/index.md`
- 新增 product spec 后，更新 `docs/product-specs/index.md`
- 执行计划完成后，从 `active/` 移到 `completed/`

### memory

- `docs/memory/` 是长期事实来源
- 用户反馈进 `user-feedback.md`
- Agent / 自检反馈进 `agent-feedback.md`
- 重复问题升级到 `prevents-recurrence.md`

### feedback

- 阻塞反馈先记录，再决定自动修复、升级模式或最终汇总
- 不要把原始终端输出直接塞进长期 memory
- 月度历史项 roll up 到 `docs/memory/feedback/archive/`

## 恢复任务时看什么

恢复时的最小顺序：

1. `AGENTS.md`
2. 当前 active exec plan
3. `docs/memory/index.md`
4. 最近一次 `Run Trace` / `Skill Workflow Record` / handoff

如果你需要更细的恢复协议，看 [Run Trace Protocol](../references/run-trace-protocol.md)。
