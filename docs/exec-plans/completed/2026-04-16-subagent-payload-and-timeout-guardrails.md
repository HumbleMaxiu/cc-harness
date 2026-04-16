# Subagent Payload And Timeout Guardrails 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**状态：** COMPLETED

**目标：** 降低 `Subagent` 模式中 `Reviewer` 因 prompt 过长、上下文打包过重、超时或内部异常导致空输出的概率，把输入打包和 timeout 恢复规则显式写进 `dev-workflow`。

**架构：** 在 workflow / 规格 / 可靠性三层补齐 guardrails：1) 主 agent 不再把全量文件列表和冗长要求直接塞进 subagent prompt，而是传递结构化的最小 handoff；2) 为 `Reviewer` / `Tester` 增加超时与空结果恢复顺序；3) 用 consistency check 固定这些约束，避免回到“长 prompt 一把梭”的脆弱状态。

**技术栈：** Markdown skills / agents、产品规格、可靠性文档、Node.js consistency checks

---

## 文件结构概览

```text
.claude/skills/
  dev-workflow/SKILL.md

docs/
  RELIABILITY.md
  product-specs/agent-system.md
  exec-plans/index.md

scripts/checks/
  harness-consistency.js
```

### 任务 1：定义 Subagent 输入打包 guardrails

**文件：**
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`docs/product-specs/agent-system.md`
- 测试：`node scripts/checks/harness-consistency.js`

- [x] **步骤 1：定义最小 subagent payload**

要求主 agent 传 `plan_path`、`task_id`、`step_scope`、`changed_files_summary`、`evidence_refs`，而不是整段粘贴所有文件列表和长篇流程说明。

- [x] **步骤 2：定义 prompt budget 约束**

明确避免把全量 diff、全量文件内容和重复规则一次性塞进 reviewer prompt。

### 任务 2：定义 timeout / empty-result 恢复协议

**文件：**
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`docs/RELIABILITY.md`
- 修改：`docs/product-specs/agent-system.md`
- 测试：`node scripts/checks/harness-consistency.js`

- [x] **步骤 1：定义 timeout-aware 重试**

第一次失败后用收窄 payload 的方式重试，而不是原样重放更长 prompt。

- [x] **步骤 2：定义观测字段**

让 `Run Trace` / handoff 里至少记录 `failure_type`、`failure_stage`、`retry_recommended`、`payload_mode`。

### 任务 3：加 consistency gate 并收尾

**文件：**
- 修改：`scripts/checks/harness-consistency.js`
- 同步：`skills/`、`.codex/`
- 测试：`npm run sync:mirrors && node scripts/checks/harness-consistency.js`

- [x] **步骤 1：先加 failing checks**
- [x] **步骤 2：同步镜像**
- [x] **步骤 3：完成计划并更新索引**

## 实施结果

1. 在 `dev-workflow` 中新增了 `Subagent Payload Guardrails`，要求默认使用 `payload_mode: compact-summary`，并以 `changed_files_summary` 与 `evidence_refs` 代替全量内联内容。
2. 新增了 `prompt-budget`、`do-not-inline-full-file-list` 约束，明确不要把全量文件列表、重复规则和全量 diff 一次性塞进 `Reviewer` / `Tester` prompt。
3. 为 subagent 恢复协议增加了 `timeout-aware-retry` 与 `narrowed-payload-retry`，要求失败重试必须先收窄 payload，而不是原样重放更长 prompt。
4. 在 `RELIABILITY` 和 `agent-system` 产品规格中同步了这些 guardrails，并用 consistency check 固定成门禁。

## 验证

- `node scripts/checks/harness-consistency.js`
- `npm run sync:mirrors`

### Run Trace
- trace_id: subagent-payload-timeout-guardrails-2026-04-16
- plan_path: docs/exec-plans/completed/2026-04-16-subagent-payload-and-timeout-guardrails.md
- task_id: subagent-payload-timeout-guardrails
- current_phase: Done
- last_handoff: final-summary
- files_touched: .claude/skills/dev-workflow/SKILL.md, docs/RELIABILITY.md, docs/product-specs/agent-system.md, README.md, scripts/checks/harness-consistency.js
- commands_run: node scripts/checks/harness-consistency.js; npm run sync:mirrors; node scripts/checks/harness-consistency.js
- last_result: APPROVED
- last_failure_reason:
- resume_entry: docs/exec-plans/completed/2026-04-16-subagent-payload-and-timeout-guardrails.md
