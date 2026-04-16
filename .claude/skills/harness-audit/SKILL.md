---
name: harness-audit
description: 检查当前项目的 harness 健康状态，读取质量记分卡、索引、checks 和 workflow 信号，输出结构化审计结果；当用户说“harness audit”“健康检查”“检查 harness 状态”时使用。
---

# Harness Audit

对当前项目的 harness 配置完整性、文档一致性和 workflow 健康度做结构化检查。

## 何时使用

- 用户说“harness audit”
- 用户想知道当前项目的 harness 健康度
- 用户想看有哪些高优先级缺口
- 用户准备决定下一轮基础设施补齐顺序

## 何时不要使用

- 用户只想看命令索引，改用 `/harness-help`
- 用户只想让系统推荐入口，改用 `/harness-guide`
- 用户准备直接执行交付前检查，改用 `/harness-quality-gate`

## 最小执行流程

1. 读取 `docs/QUALITY_SCORE.md`
2. 读取 `AGENTS.md`、`docs/exec-plans/index.md`、`docs/design-docs/index.md`、`docs/memory/index.md`
3. 优先运行 repo-local checks，例如 `node scripts/checks/harness-consistency.js`
4. 将结果整理为“通过 / 警告 / 失败 / 建议修复”
5. 将结论映射回 `docs/QUALITY_SCORE.md` 中已有的质量维度，而不是临时发明另一套口径

## 检查维度

- 文档与索引完整性
- repo-local checks 是否可运行
- active exec plan 与 completed 索引是否一致
- memory / feedback 结构是否完整
- workflow / eval / smoke 信号是否可发现
- `QUALITY_SCORE.md` 中的质量维度是否能找到对应仓库信号

## 输出格式

```markdown
### Harness Audit Report
- total_score:
- category_scores:
- passed_checks:
- warnings:
- failed_checks:
- remediation:
```

不要只给结论，要指出最高优先级缺口。
