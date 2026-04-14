# Reliability — cc-harness

## 可靠性预期

cc-harness 是一个 **无状态文档框架**，运行在 Claude Code 的会话上下文中。其可靠性取决于：

### 会话稳定性

| 场景 | 预期行为 |
|------|---------|
| **会话中断** | Harness 文档在 Git 中，Claude Code 重启后读取 `AGENTS.md` + `docs/PLANS.md` 恢复上下文 |
| **/compact 后** | Agent 重新读取 `docs/PLANS.md` 和 `docs/exec-plans/active/` 中的状态 |
| **新会话** | 从 `AGENTS.md` 开始 → 文档导航 → 进入工作流 |

### 幂等性

- Skill 和 Agent 定义（Markdown 文件）：幂等，无状态，可重复调用
- 交接文档：追加写入，不覆盖已有内容
- Exec plans：Git 版本化，可回滚

### 文档新鲜度维护

- 添加新 domain 后：更新 `docs/product-specs/index.md` 和 `AGENTS.md` nav 表
- 添加新 design doc 后：更新 `docs/design-docs/index.md`
- 执行计划完成后：从 `active/` 移动到 `completed/`，附上完成摘要

### Observability

- 目前无运行时日志输出
- Agent 工作流通过交接文档显式记录，可被主 agent 和人类审查
