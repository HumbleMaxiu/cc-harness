---
name: follow-goal
description: 为长跑任务建立 durable objective、verifiable stopping condition、validation loop 和 checkpoint progress log；适合迁移、大重构、部署重试、实验和原型打磨。Codex CLI 可衔接原生 /goal。
---

# Follow Goal

`/follow-goal` 把一个长跑任务收束成可执行的 Goal Contract：目标足够大，值得跨多轮持续推进；但又不能大到变成开放式 backlog。

参考：OpenAI Codex use case “Follow a goal”：<https://developers.openai.com/codex/use-cases/follow-goals>

## 何时使用

- 任务需要持续推进多个 checkpoint，而不是一次普通回复能完成
- 有明确 objective、验证方式和停止条件
- 适合 code migration、大重构、部署 retry loop、实验、游戏或原型打磨
- 用户希望 Codex 在可控范围内独立推进，并定期输出可信 progress status

## 何时不要使用

- 一组互不相关的小任务列表，改用 `/writing-plans` 或拆成多个任务
- 目标、边界、验证方式或停止条件不清楚，先用 `/brainstorming`
- 已有明确实施计划并只需要正常执行，直接用 `/pm-orchestrator`
- 高风险动作没有确认，必须先进入 `Operation Gate`

## 与 Codex 原生 `/goal` 的关系

Codex CLI 的 `/goal` 是实验性功能；启用后可用 `/goal <objective>` 设置目标，并用 `/goal pause`、`/goal resume`、`/goal clear` 控制运行。

`/follow-goal` 不直接替代原生命令。它负责在任何 host 中先写清楚 Goal Contract：

- 在 Codex CLI 且用户明确要用原生 `/goal` 时，把 Goal Contract 转成一条可执行的 `/goal ...` prompt
- 在 Claude Code、Codex app 或普通 skill 环境中，把 Goal Contract 写入 active exec plan、Run Trace 或 handoff，并通过 `/pm-orchestrator` / `/plan-persist` 执行

## Goal Contract

每个 goal 必须先形成以下结构，缺项时先补齐，不要直接执行：

```markdown
### Goal Contract
- objective:
- stopping_condition:
- non_goals:
- read_first:
- allowed_scope:
- validation_loop:
- progress_artifacts:
- checkpoint_cadence:
- pause_conditions:
- operation_risk:
- owner_review_needed:
```

字段要求：

- `objective`：一个 durable objective，不是任务清单
- `stopping_condition`：可验证的结束条件，例如测试通过、目标分数达到、视觉 parity 通过
- `non_goals`：明确不改什么，避免 goal 膨胀
- `read_first`：必须先读的 files、docs、issues、logs 或 plans
- `validation_loop`：每个 checkpoint 后运行的 command、eval、smoke check 或人工可审查 artifact
- `checkpoint_cadence`：多久或每完成什么粒度汇报一次
- `pause_conditions`：什么情况必须暂停并回到用户，例如外部副作用、权限、产品/策略判断、验证连续失败

## 执行流程

1. 读取 `AGENTS.md`、`docs/memory/index.md`、相关 active exec plan 和用户给出的目标。
2. 判断目标是否“比一个 prompt 大、比开放 backlog 小”。
3. 补齐 Goal Contract，特别是 `stopping_condition`、`validation_loop` 和 `pause_conditions`。
4. 如果需要完整计划，先调用 `/writing-plans` 创建或更新 `docs/exec-plans/active/*.md`。
5. 执行时通过 `/pm-orchestrator` 推进实现、review、test 和 doc sync。
6. 长会话中使用 `/plan-persist` 维持 Run Trace、checkpoint 和 drift signals。
7. 每个 checkpoint 输出简短 status；如果状态开始变得含糊，先收紧 goal，而不是追加临时指令。

## Status Update

长跑过程中，progress report 必须短而可验证：

```markdown
### Goal Status
- current_checkpoint:
- verified:
- changed_files:
- commands_run:
- remaining:
- blockers:
- next_checkpoint:
- should_pause: yes / no
```

## 停止规则

满足任一条件时停止或暂停：

- 达到 `stopping_condition`
- 出现 `pause_conditions`
- `validation_loop` 连续失败且没有新的诊断信息
- 目标漂移到 `non_goals`
- 需要用户做产品、策略、权限或外部副作用判断

没有 verifiable evidence 时，不得声称 goal 完成。
