# Harness 指南

使用这份 guide 选择合适的 `cc-harness` 入口。

## 安装到项目

在 `cc-harness` checkout 中运行：

```bash
./install.sh --target both --dest /path/to/project
```

如果只需要一个 host，使用 `--target claude-code` 或 `--target codex`。可直接交给另一个 AI coding agent 的安装说明见 [面向 AI 的安装说明](../install-ai.md)。

## 入口选择

| 场景 | 从这里开始 |
|----------|------------|
| 新项目需要 harness docs | `/harness-setup` |
| 不确定该用哪个 workflow | `/harness-help` 或 `/harness-guide` |
| 新功能或设计较重的工作 | 先 `/brainstorming`，再 `/writing-plans` |
| 长跑迁移、大重构、部署 retry 或实验 | `/follow-goal` 建立 Goal Contract，再进入 `/pm-orchestrator` |
| 明确的实现任务 | `/pm-orchestrator` |
| 小任务但需要连续性 | `/plan-persist` |
| 代码或 workflow 变更影响 docs | `/doc-sync` |
| 接近交付 | `/harness-quality-gate` |
| 用户有可复用流程反馈 | `/feedback` |
| 需要查看 feedback 历史 | `/feedback-query` |

## 开发流程

1. 读取相关 specs 和 memory。
2. 澄清或冻结 requirements。
3. 多步骤任务先写 plan。
4. 长跑任务先用 `/follow-goal` 明确 objective、stopping condition 和 validation loop。
5. 通过 `/pm-orchestrator` 执行。
6. 使用 role skills 覆盖 architecture、implementation、review、testing、challenge 和 feedback curation。
7. 同步 docs。
8. 运行 quality gate。

## Role Skill Usage

| Role Skill | 用途 |
|------------|-----|
| `/architect` | 检查 plan 和 docs impact |
| `/developer` | 基于 TDD evidence 实现 |
| `/reviewer` | 审查 changed code 和 risks |
| `/tester` | 探测并运行 verification commands |
| `/challenger` | 挑战 claims 和 assumptions |
| `/feedback-curator` | 将可复用 findings 转入 feedback memory |

## 恢复顺序

1. `AGENTS.md`
2. 当前 active exec plan
3. `docs/memory/index.md`
4. 最近的 `Run Trace` 或 handoff
