---
name: harness-guide
description: 根据用户当前场景推荐合适的 cc-harness skill、workflow 或文档入口；当用户说“harness guide”“我该用哪个 skill”“这个场景怎么走”时使用。
---

# Harness Guide

根据用户当前任务场景，推荐最合适的 `cc-harness` skill、workflow 和文档入口。

## 何时使用

- 用户问“我该从哪里开始”
- 用户问“这个场景该用哪个 skill”
- 用户想知道 bugfix / 新功能 / 架构变更 / feedback 各该怎么走
- 用户不确定是走 `brainstorming`、`writing-plans` 还是 `dev-workflow`

## 何时不要使用

- 用户只想看完整命令索引，改用 `/harness-help`
- 用户要做健康检查，改用 `/harness-audit`
- 用户准备执行交付前门禁，改用 `/harness-quality-gate`

## 最小执行流程

1. 读取 `AGENTS.md`
2. 读取 `docs/guides/harness-guide.md`
3. 扫描 `skills/`，确认本仓库中的实际可用入口
4. 根据用户场景给出一个主推荐入口和可选后续路径

## 推荐原则

- 创造性、高不确定性任务：先 `/brainstorming`
- 多步骤落地：先 `/writing-plans`
- 已有清晰计划，需要执行：进 `/dev-workflow`
- 只做文档维护：用 `/doc-sync`
- 提反馈：用 `/feedback`
- 查反馈：用 `/feedback-query`
- 不知道怎么开始：先用 `/harness-help`

## 输出格式

```markdown
### Harness Guide
- scenario:
- recommended_entry:
- why:
- next_step:
- fallback_entries:
```

优先只给一个主入口，避免把用户重新扔回选择困难。
