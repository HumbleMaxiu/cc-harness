# Reliability — cc-harness

## 可靠性预期

cc-harness 是一个 **无状态文档框架**，运行在 Claude Code 的会话上下文中。其可靠性取决于：

### Run Trace

`cc-harness` 的最小可靠性锚点不是完整聊天记录，而是结构化运行轨迹。

每个进行中任务至少应能恢复出：

- `trace_id`
- `plan_path`
- `task_id`
- `current_phase`
- `last_handoff`
- `commands_run`
- `last_result`
- `last_failure_reason`
- `resume_entry`

详细字段见 [run-trace-protocol.md](references/run-trace-protocol.md)。

### 会话稳定性

| 场景 | 预期行为 |
|------|---------|
| **会话中断** | 优先读取最近一次 `Run Trace`、对应 plan、memory 和最新结构化记录，而不是依赖聊天上下文 |
| **/compact 后** | Agent 先读 `Run Trace` 与关联的 `Skill Workflow Record` / handoff，再决定恢复阶段 |
| **新会话** | 从 `AGENTS.md` → `docs/memory/index.md` → active exec plan → `resume_entry` 恢复 |

### Resume Protocol

恢复顺序：

1. 读取 `AGENTS.md` 与对应 active exec plan
2. 读取 `docs/memory/index.md` 与 `prevents-recurrence`
3. 读取最近一次 `Run Trace` 所指向的 `resume_entry`
4. 检查最近结果是否为 `REJECTED` / `BLOCKED`
5. 仅在事实来源清晰时继续执行

停止条件：

- 找不到最近一次结构化记录
- 当前阶段无法判断
- 本地文件状态与最近记录冲突
- 存在 `Operation Gate` 且尚未确认

### 幂等性

- Skill 和 Agent 定义（Markdown 文件）：幂等，无状态，可重复调用
- 交接文档：追加写入，不覆盖已有内容
- Exec plans：Git 版本化，可回滚
- Run Trace：结构化摘要可重复更新，不依赖完整终端输出

### 文档新鲜度维护

- 添加新 domain 后：更新 `docs/product-specs/index.md` 和 `AGENTS.md` nav 表
- 添加新 design doc 后：更新 `docs/design-docs/index.md`
- 执行计划完成后：从 `active/` 移动到 `completed/`，附上完成摘要

### Observability

- 目前无完整运行时日志输出
- Agent 工作流通过 `Skill Workflow Record`、交接文档和 `Run Trace` 显式记录，可被主 agent 和人类审查
- 长期 memory 只保留跨任务可复用事实；阶段性轨迹保留在任务层结构化记录中
