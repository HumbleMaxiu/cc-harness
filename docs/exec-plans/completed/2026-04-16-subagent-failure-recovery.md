# Subagent Failure Recovery 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**状态：** COMPLETED

**目标：** 修复 `dev-workflow` 的 `Subagent` 模式在 `Reviewer` 空返回、无效 handoff 或内部异常时容易中断并误跳过 `Tester` 的流程缺口，建立稳定的失败恢复协议。

**架构：** 通过三层收紧：1) 在 `dev-workflow` 中定义 `subagent execution failure` 的检测、重试与 fallback 规则；2) 在 `Reviewer` / `Tester` 契约中补齐 handoff 有效性与 `BLOCKED` 失败回报格式；3) 用 consistency check 把“Reviewer 失败不能被当作通过、Tester 不得静默跳过”变成可执行门禁。

**技术栈：** Markdown skills / agents、产品规格、设计文档、Node.js consistency checks

---

## 文件结构概览

```text
.claude/skills/
  dev-workflow/SKILL.md

.claude/agents/
  reviewer.md
  tester.md

docs/
  product-specs/agent-system.md
  design-docs/reviewer.md
  design-docs/tester.md
  exec-plans/index.md

scripts/checks/
  harness-consistency.js
```

### 任务 1：定义 Subagent 失败恢复协议

**文件：**
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`docs/product-specs/agent-system.md`
- 测试：`node scripts/checks/harness-consistency.js`

- [x] **步骤 1：定义无效 handoff / 空返回的失败类型**

把“上游没有有效内容”“缺少状态”“缺少关键区块”定义成 `subagent execution failure`，不能继续沿用正常状态机。

- [x] **步骤 2：定义 Reviewer 失败后的重试与 fallback**

先自动重试同角色；仍失败时允许同角色 fallback，但必须产出完整角色等价 handoff。

- [x] **步骤 3：把 Tester 设为不可静默跳过**

Subagent 模式下只有在拿到有效 `Reviewer APPROVED` 或等价 fallback handoff 后才能进入 Tester，且 build/dev-server 证据不能替代 Tester handoff。

### 任务 2：升级 Reviewer / Tester 契约

**文件：**
- 修改：`.claude/agents/reviewer.md`
- 修改：`.claude/agents/tester.md`
- 修改：`docs/design-docs/reviewer.md`
- 修改：`docs/design-docs/tester.md`
- 测试：人工检查输入输出和状态机描述一致

- [x] **步骤 1：补齐失败回报字段**

新增 `failure_type`、`failure_stage`、`retry_recommended`、`fallback_allowed` 等字段。

- [x] **步骤 2：补齐 handoff 有效性约束**

要求无法完成完整审查 / 验证时输出 `BLOCKED`，而不是留下空结果。

### 任务 3：加 consistency gate 并收尾

**文件：**
- 修改：`scripts/checks/harness-consistency.js`
- 同步：`skills/`、`agents/`、`.codex/`
- 测试：`npm run sync:mirrors && node scripts/checks/harness-consistency.js`

- [x] **步骤 1：先加 failing checks**
- [x] **步骤 2：同步镜像**
- [x] **步骤 3：完成计划并更新索引**

## 实施结果

1. 在 `dev-workflow` 的 `Subagent` 模式中新增了 `Subagent Failure Handling`，把 `empty-result`、`invalid-handoff`、`tool-execution-failure` 定义为独立失败类型。
2. 新增了 `Reviewer` 失败后的自动重试和 `main-agent-fallback` 规则，并要求 fallback 也必须产出完整 Reviewer 等价 handoff。
3. 明确了 `tester-stage-required`：没有有效 `Reviewer APPROVED` 或合法 fallback handoff 时，不得进入 Tester；构建成功、dev server 正常、手工 spot-check 都不能替代 Tester handoff。
4. 升级了 `Reviewer` / `Tester` agent 契约与设计文档，加入 `failure_type`、`failure_stage`、`retry_recommended`、`fallback_allowed`、`fallback_source`。
5. 用 `harness-consistency` 把这些规则提升为门禁，防止将来回归到“空返回也继续交付”的状态。

## 验证

- `node scripts/checks/harness-consistency.js`
- `npm run sync:mirrors`

### Run Trace
- trace_id: subagent-failure-recovery-2026-04-16
- plan_path: docs/exec-plans/completed/2026-04-16-subagent-failure-recovery.md
- task_id: subagent-failure-recovery
- current_phase: Done
- last_handoff: final-summary
- files_touched: .claude/skills/dev-workflow/SKILL.md, .claude/agents/reviewer.md, .claude/agents/tester.md, docs/design-docs/reviewer.md, docs/design-docs/tester.md, docs/product-specs/agent-system.md, README.md, scripts/checks/harness-consistency.js
- commands_run: node scripts/checks/harness-consistency.js; npm run sync:mirrors; node scripts/checks/harness-consistency.js
- last_result: APPROVED
- last_failure_reason:
- resume_entry: docs/exec-plans/completed/2026-04-16-subagent-failure-recovery.md
