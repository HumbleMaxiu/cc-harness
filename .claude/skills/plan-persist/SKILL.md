---
name: plan-persist
description: 为当前任务提供轻量 planning 持续化，围绕 active exec plan、Run Trace 和 hook 回注维持上下文连续性；适合 bugfix、小任务、探索任务或 /compact 后恢复，不替代 writing-plans。
---

# Plan Persist

为当前任务提供轻量 planning 持续化能力。它不创建第二套长期事实源，而是围绕现有 `docs/exec-plans/active/`、`Run Trace` 和 `Skill Workflow Record` 持续提醒与恢复。

## 何时使用

- 当前任务不大，但仍需要轻量状态追踪
- 正在做 bugfix、探索任务、小范围收尾
- 担心长会话中计划漂移
- 准备 `/compact` 前后保持恢复锚点

## 何时不要使用

- 任务复杂、跨模块、需要完整实施计划时，优先 `/writing-plans`
- 用户只是想查看命令索引，改用 `/harness-help`
- 用户要开始正式执行复杂任务，改用 `/writing-plans` → `/dev-workflow`

## 边界

- `/writing-plans`：生成完整实施计划
- `/plan-persist`：维持当前计划和轨迹持续可见

`/plan-persist` 不应新建平行于 `docs/exec-plans/` 的 `task_plan.md / progress.md / findings.md` 体系。

## 最小执行流程

1. 读取 `docs/exec-plans/active/`，确认当前 active plan
2. 读取 `docs/references/run-trace-protocol.md` 与 `docs/RELIABILITY.md`
3. 读取最近一次 `Run Trace` 或 `Skill Workflow Record`
4. 当发现缺少 `plan_path`、存在未决 blocker 或高风险 gate 时，先提示恢复或补记录
5. 依赖 hooks 在用户输入、工具调用前后和停止时持续回注当前状态

## 输出格式

```markdown
### Plan Persist Status
- active_plan:
- latest_run_trace:
- blockers:
- next_update_point:
```

目标是维持连续性，而不是替代正式 planning。
