---
name: harness-quality-gate
description: 在交付、提交或阶段收尾前执行 cc-harness 的质量门禁，综合 repo-local checks、文档同步、风险与验证信号给出 PASS/WARN/BLOCK；当用户说“quality gate”“harness quality gate”“交付前检查”时使用。
---

# Harness Quality Gate

在交付、提交或阶段性收尾前，执行一组最合适的本地检查，并明确当前结果是 `PASS`、`WARN` 还是 `BLOCK`。

## 何时使用

- 用户说“quality gate”
- 用户准备交付、提交、结束当前阶段
- 用户想知道“现在能不能算完成”
- 用户想集中看验证、文档同步和剩余风险

## 何时不要使用

- 用户只想看健康度总览，改用 `/harness-audit`
- 用户还在选 workflow 入口，改用 `/harness-guide`
- 用户只是想看命令索引，改用 `/harness-help`

## 最小执行流程

1. 读取当前 active exec plan、最近 `Run Trace` 或 `Skill Workflow Record`
2. 探测本仓库可运行的本地 checks
3. 运行最相关的检查，例如：
   - `node scripts/checks/harness-consistency.js`
   - `npm test`
   - 其他 repo-local eval / smoke / behavior checks
4. 检查 docs 是否需要同步、是否仍有未决风险或阻塞反馈
5. 给出结构化门禁结果

## 判定规则

- `PASS`：关键 checks 通过，且没有未决 blocker
- `WARN`：可交付但仍有低中风险缺口，需要在总结中显式提示
- `BLOCK`：存在失败检查、未决高风险动作或关键验证缺失

## 输出格式

```markdown
### Quality Gate Result
- status: PASS / WARN / BLOCK
- checks_run:
- passed:
- failed:
- remaining_risks:
- next_action:
```

不要在未运行检查时声称通过质量门禁。
