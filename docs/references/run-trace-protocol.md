# Run Trace Protocol

> `cc-harness` 的最小运行轨迹与恢复协议。目标不是保存完整会话日志，而是为中断恢复、`/compact` 续跑和最终审计提供稳定锚点。

## 最小 Run Trace 结构

每次主动执行中的任务，至少应能从 `Skill Workflow Record` 或多角色交接链中恢复出以下字段：

```markdown
### Run Trace
- trace_id:
- plan_path:
- task_id:
- current_phase:
- last_handoff:
- files_touched:
- commands_run:
- last_result:
- last_failure_reason:
- resume_entry:
```

字段说明：

- `trace_id`：当前任务链的稳定标识，可被 feedback / archive 引用
- `plan_path`：对应的执行计划或主事实来源
- `task_id`：当前任务或子任务标识
- `current_phase`：恢复时应回到的阶段，例如 `Plan Check`、`Execute`、`Reviewer`、`Tester`
- `last_handoff`：最近一次结构化交接或 `Skill Workflow Record` 更新点
- `files_touched`：最近一轮涉及的文件范围
- `commands_run`：最近一轮关键命令与结果摘要
- `last_result`：最近一次阶段结论，如 `APPROVED` / `REJECTED` / `BLOCKED`
- `last_failure_reason`：最近一次阻塞或失败原因；无则留空
- `resume_entry`：恢复时应优先读取的文档或区块

## 模式映射

### Skill 模式

- 主事实来源：`Skill Workflow Record`
- 最小恢复锚点：`Context`、`Mode Decision`、`Execution`、`Self Review`、`Verification`、`Doc Sync`、`Final Summary`
- `Run Trace` 可以内嵌在 `Skill Workflow Record` 中，作为当前阶段的简洁摘要

### Subagent / Team 模式

- 主事实来源：多角色交接文档链
- 最小恢复锚点：最近一次 `APPROVED / REJECTED / BLOCKED` 交接文档
- `Run Trace` 可以放在统一交接文档骨架中，确保主 agent 能快速定位“最后进行到哪里”

## Resume Protocol

### 新会话恢复

1. 读取 `AGENTS.md` 和当前 `docs/exec-plans/active/` 中对应计划
2. 读取 `docs/memory/index.md`，再读取 `prevents-recurrence`
3. 读取最近一次 `Run Trace` 所指向的 `resume_entry`
4. 确认当前是否仍有未完成的阻塞反馈或待确认高风险动作
5. 只有当事实来源足够清晰时才继续执行；否则先补事实或请用户确认

### `/compact` 后恢复

1. 优先读取最近一次 `Run Trace`
2. 再读取关联的 `Skill Workflow Record` 或最近一次 handoff
3. 检查 `current_phase` 与 `last_result`
4. 若 `last_result=REJECTED / BLOCKED`，先处理阻塞而不是直接继续实现

### 中断恢复

1. 找到最近一次写入的结构化记录
2. 对照 `commands_run` 与 `files_touched` 判断本地状态是否已漂移
3. 若本地事实与记录冲突，以仓库中的最新结构化记录和实际文件状态为准
4. 若存在 `Operation Gate` 且 `confirmation_status=pending`，不得继续高风险动作

## 停止条件

遇到以下情况时，不应假装已经恢复完成：

- 找不到对应计划或最近一次结构化记录
- `current_phase` 无法判断
- 本地文件状态与最近一次记录明显冲突
- 存在未决 `Operation Gate`
- 关键 memory / feedback 事实缺失

此时应先补事实来源，或明确向用户说明恢复阻塞点。

## 长期 Memory 与任务层轨迹边界

### 写入长期 memory 的内容

- 可跨任务复用的用户偏好
- 已抽象的 feedback 模式与规则
- 已升级为 `prevents-recurrence` 的约束

### 保留在任务层 Run Trace 的内容

- 当前阶段与最近一次 handoff
- 关键命令摘要
- 最近一次失败原因
- 本轮文件范围与恢复入口

### 不应进入长期 memory 的内容

- 原始终端输出全文
- 临时调试日志
- 仅对当前任务有意义的阶段性细节

原则上：长期 memory 记录“以后还要记住什么”，任务层 trace 记录“这次做到哪了”。
