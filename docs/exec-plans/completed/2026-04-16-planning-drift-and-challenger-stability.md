# Planning Drift Detection 与 Challenger 稳定接入实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**状态：** COMPLETED

**目标：** 强化 `planning drift detection`，并把 `Challenger` 更稳定地接入 `/dev-workflow`，同时保持 `docs/exec-plans/ + Run Trace + Skill Workflow Record` 作为唯一计划事实链，不引入第二套 planning 存储。

**架构：** 通过三层同时收紧协议：1) 在 `dev-workflow`、`plan-persist`、`challenger` 契约中补齐结构化输入输出；2) 在 planning hooks 中加入最小 drift signal 检测；3) 在一致性检查里把这些要求提升为可执行门禁，并同步产品规格、可靠性和对外说明。

**技术栈：** Node.js hooks、Markdown skills / agents / design docs、consistency checks

---

## 文件结构概览

```text
.claude/skills/
  dev-workflow/SKILL.md
  plan-persist/SKILL.md

.claude/agents/
  challenger.md

.claude/scripts/hooks/
  plan-status.js
  plan-refresh.js
  plan-write-reminder.js
  plan-stop-check.js

docs/
  RELIABILITY.md
  references/run-trace-protocol.md
  product-specs/agent-system.md
  design-docs/challenger.md
  design-docs/index.md
  exec-plans/index.md

scripts/checks/
  harness-consistency.js
```

### 任务 1：把 planning drift detection 升级为可执行协议

**文件：**
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`.claude/skills/plan-persist/SKILL.md`
- 修改：`.claude/scripts/hooks/plan-status.js`
- 修改：`.claude/scripts/hooks/plan-refresh.js`
- 修改：`.claude/scripts/hooks/plan-write-reminder.js`
- 修改：`.claude/scripts/hooks/plan-stop-check.js`
- 测试：`node scripts/checks/harness-consistency.js`

- [x] **步骤 1：收紧 Plan Drift 记录字段**

要求 `Plan Drift` 不只声明类型，还要声明检测依据、是否未解决、何时回写计划。

- [x] **步骤 2：在 hooks 中增加最小 drift signal**

让 `plan-persist` hooks 能提示缺失 `Run Trace`、缺失 `plan_path`、未决 `Operation Gate`、未解决 drift 等硬信号。

- [x] **步骤 3：补齐可靠性与协议文档**

同步 `Run Trace Protocol`、`RELIABILITY.md`、README 与产品规格中的 drift detection 说明。

### 任务 2：让 Challenger 更稳定接入 dev-workflow

**文件：**
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`.claude/agents/challenger.md`
- 修改：`docs/design-docs/challenger.md`
- 修改：`docs/product-specs/agent-system.md`
- 测试：`node scripts/checks/harness-consistency.js`

- [x] **步骤 1：定义 Challenger Gate 触发矩阵**

明确何时必须触发、何时可跳过，以及由谁消费结果。

- [x] **步骤 2：补齐 Challenger 输入输出契约**

要求稳定提供 `trigger_reason`、`review_scope`、`evidence_refs`、`blocking_threshold`，输出明确的 follow-up 与 gate 决策。

- [x] **步骤 3：把 Subagent / Skill 模式的接入点写清楚**

避免 Challenger 只停留在“需要时可以触发”的软描述。

### 任务 3：把新约束提升到 consistency check 与镜像体系

**文件：**
- 修改：`scripts/checks/harness-consistency.js`
- 同步：`skills/`、`agents/`、`scripts/hooks/`、`.codex/`
- 测试：`npm run sync:mirrors && node scripts/checks/harness-consistency.js`

- [x] **步骤 1：先加 failing checks**

让缺失的 drift detection / Challenger contract 会导致检查失败。

- [x] **步骤 2：同步镜像**

以 `.claude/` 为事实源，确认镜像三边一致。

- [x] **步骤 3：完成计划并更新索引**

## 实施结果

1. 为 `plan-persist` hooks 增加了共享的 drift signal 检测逻辑，并把 `drift_status`、`drift_signals`、`pending_operation_gate` 回注到 `UserPromptSubmit` / `PreToolUse` / `PostToolUse` / `Stop` 提示链路中。
2. 收紧了 `dev-workflow` 的 `Plan Drift` 结构，新增 `detection_basis`、`next_plan_update`，并把 `missing-run-trace`、`missing-plan-path`、`pending-operation-gate`、`unresolved-plan-drift` 固化为第一阶段最小 signals。
3. 为 `challenger` 增加稳定的 `Challenger Gate` 契约，明确 `trigger_reason`、`review_scope`、`evidence_refs`、`blocking_threshold` 与 `recommended_gate`，并把 Skill / Subagent / Team 模式下的接入点写清。
4. 更新了产品规格、可靠性说明、运行轨迹协议和 README，并通过 mirror sync 同步到 `skills/`、`agents/`、`scripts/hooks/` 与 `.codex/`。

## 验证

- `node scripts/checks/harness-consistency.js`
- `npm run sync:mirrors`
- `printf 'hook-smoke\n' | node scripts/hooks/plan-status.js`
- `printf 'hook-smoke\n' | node scripts/hooks/plan-refresh.js`
- `printf 'hook-smoke\n' | node scripts/hooks/plan-write-reminder.js`
- `printf 'hook-smoke\n' | node scripts/hooks/plan-stop-check.js`
- `npm test`（`harness-consistency` 与 `harness-evals` 通过；`harness-behavior-evals` 仍因 `brainstorming-dev-workflow-e2e/pass-small-task` fixture 缺少 runtime artifacts 而失败）

### Run Trace
- trace_id: plan-drift-challenger-stability-2026-04-16
- plan_path: docs/exec-plans/completed/2026-04-16-planning-drift-and-challenger-stability.md
- task_id: planning-drift-challenger-stability
- current_phase: Done
- last_handoff: final-summary
- files_touched: .claude/skills/dev-workflow/SKILL.md, .claude/skills/plan-persist/SKILL.md, .claude/agents/challenger.md, .claude/scripts/hooks/*, docs/RELIABILITY.md, docs/references/run-trace-protocol.md, docs/product-specs/agent-system.md, docs/design-docs/challenger.md, README.md, scripts/checks/harness-consistency.js
- commands_run: node scripts/checks/harness-consistency.js; npm run sync:mirrors; hook smoke commands; npm test
- last_result: APPROVED
- last_failure_reason: `npm test` still reports a pre-existing missing-artifacts behavior-eval fixture
- resume_entry: docs/exec-plans/completed/2026-04-16-planning-drift-and-challenger-stability.md

把本计划从 `active/` 移到 `completed/`，并在索引中记录结果。
