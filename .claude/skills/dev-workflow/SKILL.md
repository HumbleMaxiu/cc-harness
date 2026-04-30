---
name: dev-workflow
description: 开发流程 agent 系统。包含 A/Dev/R/T 四种角色，支持 Skill/Subagent/Team 三种模式。接在 writing-plans 之后。
---

# Dev Workflow Agent System

开发流程 agent 系统，遵循 harness engineering 原则。
接在 `writing-plans` 技能之后使用。

## 入口规则

- 创造性任务先经过 `brainstorming` / `writing-plans`，再进入实现
- 小型 bugfix、探索任务或 `/compact` 前后的轻量状态持续化，可先使用 `/plan-persist`
- 主 agent 开始执行前先读取 `docs/memory/index.md` 和 `docs/memory/feedback/prevents-recurrence.md`
- 没有可接受的设计输入时，不直接进入 Developer 实现

## 统一风险模型

`dev-workflow` 同时使用两类风险字段：

- `risk_level`：反馈或发现的问题严重性，取值 `low / medium / high`
- `operation_risk`：计划执行动作的工具/权限风险，取值 `read-only / reversible-write / irreversible-write / external-side-effect`

### 操作风险等级

| operation_risk | 含义 | 默认策略 |
|----------------|------|---------|
| `read-only` | 只读分析、搜索、查看、diff、静态检查 | 默认允许 |
| `reversible-write` | 可回滚的局部代码/文档/配置修改 | 条件允许，可纳入自动执行白名单 |
| `irreversible-write` | 删除、迁移、批量重写、难以无损回退的修改 | 禁止自动执行，执行前需用户确认 |
| `external-side-effect` | 发布、部署、联网写入、外部系统操作、权限变更 | 禁止自动执行，执行前需用户确认 |

### 风险决策规则

- `read-only`：主流程可直接继续，并在最终总结汇报关键发现
- `reversible-write`：仅当 `risk_level=low` 且 `action_type` 命中自动执行白名单时允许自动推进
- `irreversible-write`：不得自动推进；必须产出 `Operation Gate`，等待用户确认
- `external-side-effect`：不得自动推进；必须产出 `Operation Gate`，等待用户确认

### 高风险动作约束模板

当计划动作属于 `irreversible-write` 或 `external-side-effect` 时，先整理：

```markdown
### Operation Gate
- objective:
- requested_action:
- target_paths_or_systems:
- operation_risk:
- expected_side_effects:
- reversibility:
- rollback_plan:
- confirmation_status: pending
```

没有这段结构化 gate，不要直接执行高风险动作。

## 运行轨迹与恢复

`dev-workflow` 在三种模式下都必须保留最小 `Run Trace`，以便中断恢复、`/compact` 续跑和最终审计。

### 最小 Run Trace

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

### 恢复顺序

1. 读取当前 active exec plan
2. 读取 `docs/memory/index.md` 和 `prevents-recurrence`
3. 读取最近一次 `Run Trace` 指向的 `resume_entry`
4. 根据 `current_phase` 与 `last_result` 决定从哪个阶段继续
5. 若存在 `Operation Gate` 且未确认，先停在 gate，而不是继续执行

启用 `/plan-persist` 时，`UserPromptSubmit / PreToolUse / PostToolUse / Stop` hooks 可以持续回注当前 plan 与 trace，但它们只作为辅助提醒，不替代结构化记录。

### 模式映射

- `Skill`：`Run Trace` 内嵌在 `Skill Workflow Record` 或与其并存
- `Subagent` / `Team`：`Run Trace` 跟随统一交接文档骨架，由最近一次 handoff 提供恢复锚点

## 角色

| 角色 | Agent | 职责 |
|------|-------|------|
| 架构师 | architect | 任务开始前检查计划，开发完成后维护文档 |
| 挑战者 | challenger | 对计划、claim、API 假设和完成声明做对抗式验证 |
| 开发者 | developer | TDD 实现功能 |
| 审查者 | reviewer | 代码审查，质量把关 |
| 测试工程师 | tester | 测试验证 |
| 反馈整理员 | feedback-curator | 整理 `Feedback Record`，维护 feedback memory，输出自动处理轨迹与最终汇总摘要 |

## 三种开发模式

### 模式选择速判

先用下表判断默认模式，再在执行中根据反馈和风险升级。不要只按“任务大小”选择模式；重点看是否需要独立视角、状态追踪和循环收口。

| 模式 | 一句话定位 | 主要收益 | 主要代价 | 选择成本 | 错误使用信号 |
|------|------------|----------|----------|----------|--------------|
| `Skill` | 主 agent 串行执行的轻量闭环 | 快、上下文集中、适合小范围变更 | 独立审查弱，容易把自检当 reviewer | 低：只维护 `Skill Workflow Record` | 已出现第二轮反馈、需要独立 reviewer/tester、或完成声明依赖复杂推断 |
| `Subagent` | 主 agent 编排 A/Dev/R/T/C 的串行 handoff | 状态清楚，门禁明确，适合 review/test loop | prompt 打包和 handoff 校验成本更高 | 中：每个角色必须产出有效 handoff | 空 handoff 被当通过、Tester 被 build 替代、Challenger Gate 没有落到流程 |
| `Team` | 多个独立视角并行审查/验证 | 并行覆盖多个风险面，适合高风险或争议变更 | 协调和汇总成本最高，容易产生结论冲突 | 高：需要合并多个 reviewer/tester/challenger 结论 | 只是普通串行审查却开 Team，或没有明确并行问题拆分 |

默认建议：

- 小范围、低风险、单文件或纯文档变更：从 `Skill` 开始。
- 需要真实 reviewer/tester 门禁、预计会有修复回流、或需要 Challenger 独立挑战：从 `Subagent` 开始。
- 同一变更需要多个互不依赖的审查面并行判断：才使用 `Team`。

### Skill 模式

**适用场景**：单一任务、边界清楚、工具数量有限、不需要独立 reviewer 角色或并行审查

**执行方式**：主 agent 以单 agent workflow 的方式串行执行固定阶段，而不是调用 subagent。Skill 模式必须显式产出结构化阶段记录，并在必要时升级到 `Subagent` 或 `Team` 模式；用户只在最终交付时统一确认。

#### Skill 模式状态机

```text
Input Ready
  ↓
Plan Check
  ↓
Execute
  ↓
Self Review
  ↓
Verify
  ↓
Doc Sync
  ↓
Final Summary
  ↓
Done
```

#### Skill 模式阶段说明

| 阶段 | 目标 | 最小输出 |
|------|------|---------|
| Input Ready | 确认需求、计划、memory 输入完整 | 输入是否齐备；是否可继续 |
| Plan Check | 进行最小 Architect 检查，判断是否适合继续停留在 Skill 模式 | `Mode Decision` |
| Execute | 实现代码或文档变更，并在结束时检查是否发生计划偏移 | `Execution` + `Plan Drift` |
| Self Review | 用显式 checklist 进行单 agent 自检 | `Self Review` + `Feedback Record` |
| Verify | 探测并执行最合适的验证入口 | `Verification` |
| Doc Sync | 调用 `/doc-sync` 契约检查并同步受影响文档 | `Doc Sync` |
| Final Summary | 汇总结果、风险、未执行建议、模式升级建议，并确认是否仍有未处理的计划偏移 | `Final Summary` |

#### Skill 模式最小产物

Skill 模式不要求生成多角色 handoff 文档，但必须至少在交付前整理一份 `Skill Workflow Record`：

```markdown
## Skill Workflow Record

### Context
- plan_path:
- task_scope:
- mode: skill
- operation_risk:

### Mode Decision
- fit_for_skill_mode:
- escalation_reason:
- plan_drift_watchpoints:

### Execution
- files_touched:
- commands_run:
- artifacts:
- confirmation_needed:

### Plan Drift
- drift_detected:
- drift_type:
- evidence:
- detection_basis:
- impact_on_plan:
- required_action:
- next_plan_update:
- resolved_by:

### Self Review
- checklist:
- issues_found:
- feedback_record:

### Verification
- detected_entrypoints:
- executed_checks:
- assumptions:
- uncovered_risks:

### Doc Sync
- docs_checked:
- docs_updated:
- reviewed_no_change:
- follow_up_needed:
- nav_or_index_updated:

### Final Summary
- outcome:
- remaining_risks:
- followups:
- plan_drift_status:
- unexecuted_high_risk_actions:
```

这个记录用于：

- 支撑 `/compact` 或新会话后的恢复
- 为 memory / feedback 提供事实来源
- 让 Skill 模式也具备审计性，而不是只依赖隐式上下文

#### Skill 模式中的反馈处理

- **阻塞反馈来源**：自检发现严重问题、验证失败、文档同步发现规范冲突
- **记录要求**：阻塞与非阻塞反馈都必须先进入 `Feedback Record`
- **自动修复条件**：仅当 `risk_level=low`、`operation_risk` 属于 `read-only` 或 `reversible-write`，且 `action_type` 属于自动执行白名单时，允许在 Skill 模式内自动修复并继续
- **升级条件**：一旦反馈表明任务已需要独立 reviewer、重复循环或更强状态追踪，立即升级到 `Subagent 模式`

#### Skill 模式中的计划偏移检测

- `Plan Check` 阶段必须先判断是否存在可接受的 `plan_path`；如果即将进行实质性改动却没有计划来源，视为 `missing-plan`，不得继续进入 `Execute`
- `Execute` 结束后必须检查一次 `Plan Drift`
- `Final Summary` 前必须再次检查 `Plan Drift`，确认是否仍存在未回写到计划或记录中的偏移
- 第一阶段只做 workflow 级检测，不依赖 hook；优先判断硬信号，而不是自由语义推断

第一阶段允许识别的 `drift_type`：

- `missing-plan`
- `out-of-scope-file`
- `scope-expanded`
- `risk-expanded`
- `untracked-follow-up`

第一阶段的最小 `drift signals`：

- `missing-run-trace`
- `missing-plan-path`
- `pending-operation-gate`
- `unresolved-plan-drift`

第一阶段判断时优先使用以下证据：

- `plan_path` 是否存在
- `task_scope` 与 `files_touched` 是否明显不匹配
- `operation_risk` 是否高于原计划假设
- 当前轮次是否产生了未记录到计划或 `followups` 的后续动作

第一阶段处理规则：

- `missing-plan`：阻塞，先补计划或升级模式
- `risk-expanded` 且进入 `irreversible-write` / `external-side-effect`：阻塞，必须进入 `Operation Gate`
- 其他偏移：不自动阻塞，但必须写入 `Plan Drift`，并在 `Final Summary` 中说明处理状态

### Challenger Gate

`Challenger` 不应再以“想到时再调用”的方式接入，而应通过稳定的 `Challenger Gate` 决策点接入 `dev-workflow`。

#### 触发矩阵

- `plan-claim`：计划依赖关键架构论证、外部事实或 API 假设时，在实现前触发
- `api-assumption`：实现依赖未在当前仓库内直接证实的 API / tool 行为时，在继续编码前触发
- `completion-claim`：完成声明依赖复杂推断、间接证据或“应该如此”时，在最终结论前触发
- `drift-verification-gap`：检测到 `unresolved-plan-drift`，且是否继续推进依赖额外证据判断时，先触发

#### Challenger Gate 输入契约

```markdown
### Challenger Gate
- challenge_required:
- trigger_reason:
- review_scope:
- evidence_refs:
- blocking_threshold:
- handoff_target:
```

要求：

- `challenge_required: true` 时，不要跳过 `challenger`
- `trigger_reason:` 只能来自固定枚举：`plan-claim / api-assumption / completion-claim / drift-verification-gap`
- `evidence_refs:` 至少列出 plan、spec、handoff、验证记录或代码证据中的一种
- `blocking_threshold:` 说明什么情况下 verdict 必须阻塞主流程

#### 模式接入点

- Skill 模式：在 `Plan Check` 或 `Final Summary` 前显式产出 `Challenger Gate` 决策；如果需要独立挑战视角，则升级到 `Subagent`
- Subagent 模式：`Architect` 后先判断是否需要 `Challenger Gate`，`Tester` / 最终总结前再次判断是否需要针对 `completion-claim` 触发
- Team 模式：`challenger` 作为独立 gatekeeper 视角参与，不与 reviewer/tester 混写

`challenger` 输出固定的 `CLAIM / CHALLENGE / VERIFICATION / VERDICT` 结构，以及明确的 follow-up gate，主 agent 再决定继续、补验证或阻塞回退。

#### 模式升级规则

- **Skill → Subagent**
  - 出现循环审查需求
  - 出现 2 轮以上反馈回流
  - 需要独立 reviewer / tester 视角
  - 任务跨度或风险已超出单 agent 串行 workflow 的可控范围
- **Subagent → Team**
  - 需要多视角并行审查
  - 需要并行验证不同风险面
- **禁止继续停留在 Skill 模式**
  - `irreversible-write` 或 `external-side-effect` 未获确认
  - 复杂 tool orchestration
  - 强状态追踪需求
  - 需要明确 gatekeeper 角色

#### Skill 模式内部子 Skill

Skill 模式后续建议引入少量阶段型专用 Skill，用于稳定单 agent workflow 的关键阶段，而不是按角色镜像拆分更多 Skill。

当前建议的第一批是：

- `plan-check-skill`
- `self-review-skill`
- `verification-skill`

详细契约见：

- [references/skill-mode-specialized-skills.md](references/skill-mode-specialized-skills.md)
- [internal-skills/plan-check-skill/SKILL.md](internal-skills/plan-check-skill/SKILL.md)
- [internal-skills/self-review-skill/SKILL.md](internal-skills/self-review-skill/SKILL.md)
- [internal-skills/verification-skill/SKILL.md](internal-skills/verification-skill/SKILL.md)

`Doc Sync` 阶段不再继续内嵌自由发挥逻辑，而是应直接复用顶级 `/doc-sync` Skill 的输入输出契约。

这些子 Skill 初期应作为 `dev-workflow` 的内部子 skill 使用，不急于暴露成用户直接调用的顶层入口。`/doc-sync` 是例外：它既服务 Skill 模式，也服务 Subagent 模式，应作为跨模式复用的顶级 Skill 维护。

#### Skill 模式内部子 Skill 调用模式

`dev-workflow` 在 Skill 模式下应按阶段需要显式读取并套用对应内部子 skill，而不是把它们当成独立角色：

1. 进入 `Plan Check` 时，读取 `internal-skills/plan-check-skill/SKILL.md`，输出可并入 `Mode Decision` 的判断。
2. `Mode Decision` 需要记录 `plan_drift_watchpoints`，至少指出本轮最可能发生偏移的范围或风险边界。
3. 完成 `Execute` 后，先写入 `Execution` 与 `Plan Drift`，再读取 `internal-skills/self-review-skill/SKILL.md`，输出可并入 `Self Review` 的 checklist 与 `feedback_record`。
4. 进入 `Verify` 时，读取 `internal-skills/verification-skill/SKILL.md`，输出可并入 `Verification` 的验证记录、假设与未覆盖风险。
5. 进入 `Doc Sync` 时，读取 `skills/doc-sync/SKILL.md` 及其 references，输出可并入 `Doc Sync` 的同步结果。
6. 若 `Challenger Gate.challenge_required=true`，则在继续前触发 `challenger` 或升级到需要独立挑战视角的模式。
7. `Final Summary` 前再次核对 `Plan Drift` 是否已被解决、回写或升级，不要把未说明的偏移带到交付结论里。
8. 将上述输出拼装回同一份 `Skill Workflow Record`，再继续 `Final Summary`。

最小示例：

```markdown
## Skill Workflow Record

### Run Trace
- trace_id:
- current_phase:
- last_handoff:
- last_result:
- last_failure_reason:
- resume_entry:

### Mode Decision
- fit_for_skill_mode: true
- escalation_reason:
- plan_drift_watchpoints:
  - scope currently limited to docs/product-specs and skill contracts

### Execution
- files_touched:
  - .claude/skills/dev-workflow/SKILL.md
- commands_run:
  - npm test

### Plan Drift
- drift_detected: false
- drift_type:
- evidence:
- detection_basis:
- impact_on_plan:
- required_action:
- next_plan_update:
- resolved_by:

### Challenger Gate
- challenge_required: false
- trigger_reason:
- review_scope:
- evidence_refs:
- blocking_threshold:
- handoff_target:

### Self Review
- checklist:
  - task goal matched
- feedback_record:
  - source: self-check
    pattern: missing-doc-sync

### Verification
- executed_checks:
  - npm test
- assumptions:
  - consistency and eval checks represent repo-native validation for this doc-focused change
- uncovered_risks:
  - no fixture-based runtime regression yet

### Final Summary
- plan_drift_status: no unresolved drift
```

### Subagent 模式

**适用场景**：需要循环审查、有状态追踪需求

**执行方式**：
1. 主 agent 读取 `.claude/agents/` 中的 agent 定义
2. 用自然语言传递上下文给 subagent
3. Subagent 完成后主 agent 读取结果，决定下一步
4. 每个角色完成后写交接文档
5. 如交接文档包含 `Feedback Record`，主 agent 应触发 `feedback-curator` 维护 `docs/memory/feedback/agent-feedback.md`
6. 阻塞型反馈先按风险分级，再决定自动修复回流还是保留到最终确认；非阻塞建议可在最终交付前统一向用户汇总
7. 当 `Challenger Gate.challenge_required=true` 时，在 `Architect -> Developer` 之间，或 `Tester -> Final Summary` 之前插入 `challenger`

### Subagent Challenger 接入

Subagent 模式的默认主干应显式包含 Challenger Gate，而不是把 Challenger 当成临时可选角色。主 agent 必须在两个稳定点检查是否需要挑战：

| 接入点 | Gate 名称 | 触发原因 | 阻塞规则 | 通过后流向 |
|--------|-----------|----------|----------|------------|
| `Architect -> Developer` 之间 | `pre-dev-challenge` | `plan-claim` / `api-assumption` | `challenger` verdict 为 `REFUTED` 或 `UNVERIFIED` 且 blocking_threshold 命中时，回到 Architect 补计划或补证据 | `Developer` |
| `Tester -> Final Summary` 之间 | `pre-final-challenge` | `completion-claim` / `drift-verification-gap` | 完成声明无法被证据支撑时，回到 Developer / Tester 补验证；不得直接交付 | `Architect` 文档维护或最终总结 |

最小 handoff 字段：

```markdown
### Challenger Gate
- gate_name: pre-dev-challenge | pre-final-challenge
- challenge_required:
- trigger_reason:
- review_scope:
- evidence_refs:
- blocking_threshold:
- handoff_target: challenger | none

### Challenger Result
- challenger-result: CONFIRMED | REFUTED | UNVERIFIED | SKIPPED
- evidence_gap:
- required_followup:
- next_phase:
```

执行约束：

- `challenge_required=true` 时必须先调用 `challenger`，再进入下一个角色。
- `challenger-result=CONFIRMED` 才能沿主干继续。
- `challenger-result=REFUTED` 必须回到产生 claim 的角色修正计划、实现或完成声明。
- `challenger-result=UNVERIFIED` 不自动等同失败；若命中 `blocking_threshold`，先补证据或验证，否则作为 remaining risk 进入最终汇总。
- `challenge_required=false` 也要记录 gate 决策和跳过理由，避免最终总结里出现没有来源的完成声明。

### Team 模式

**适用场景**：需要多角度并行审查

**执行方式**：
1. 主 agent 创建 Agent Team
2. 多个 Reviewer 并行审查同一份代码
3. 结果汇总给主 agent

## Subagent 模式调用流程

### 单任务循环

```
主 agent
    ↓
Architect 检查计划文档
    ↓
Challenger Gate: pre-dev-challenge
    ↓ [challenge_required=true]
Challenger 对计划/API 假设做对抗式验证
    ↓
Dev 实现
    ↓
Reviewer 审查
    ↓
Feedback Curator 记录反馈并输出摘要
    ↓ [REJECTED]
自动回流修复
Dev 实现
    ↓ [APPROVED]
Tester 测试
    ↓
Challenger Gate: pre-final-challenge
    ↓ [challenge_required=true]
Challenger 对完成声明/偏移证据做对抗式验证
    ↓
Feedback Curator 记录反馈并输出摘要
    ↓ [REJECTED]
自动回流修复
Dev 实现
    ↓
[通过] → Architect 维护文档
    ↓
交付
```

### Subagent Failure Handling

`Subagent` 模式下，角色执行失败与角色结论是两回事。主 agent 不得把空返回、无效 handoff 或 subagent 内部异常误当成 `APPROVED`。

#### 失败信号

以下情况都视为 `subagent execution failure`：

- `empty-result`：subagent 返回“上游没有有效内容”、空白结果或没有可消费结论
- `invalid-handoff`：返回文本缺少最小结构化 handoff、缺少 `### 状态`，或缺少本角色关键区块
- `tool-execution-failure`：subagent 因读文件、编码、超大文件、工具异常等原因中断，未完成审查/验证

#### 恢复规则

1. 先把这次失败记入 `Run Trace`，不要直接沿用正常状态机继续。
2. 如果是 `Reviewer` 失败，执行一次 `reviewer-failure-retry`：
   - 重新锚定 `plan_path`、`task_id`、`step_scope`、关键文件范围
   - 明确要求返回完整 handoff，而不是自由文本摘要
3. 如果重试后仍失败，可触发 `main-agent-fallback`，但只能作为同角色等价 fallback：
   - 主 agent 必须显式执行 Reviewer 同等 checklist
   - 必须产出完整 Reviewer handoff
   - 必须标记 `fallback_source: main-agent`
4. 没有有效 Reviewer `APPROVED` 或等价 fallback handoff 时，不得进入 Tester。
5. `tester-stage-required`：`Subagent` 模式下，Tester 是强制门禁。`npm run build`、dev server 正常、人工 spot-check 都只能作为 Tester 证据，不能替代 Tester handoff。
6. 如果 Reviewer / Tester 失败后既没有成功重试，也没有合法 fallback，则主流程应 `BLOCKED`，而不是静默跳过角色。

### Subagent Payload Guardrails

`Subagent` 模式的稳定性不仅取决于角色定义，也取决于主 agent 如何打包输入。不要把全量文件列表、全量 diff 和重复规则直接塞进 subagent prompt。

#### 最小 payload 契约

主 agent 传给 `Reviewer` / `Tester` 的最小 payload 应优先使用结构化摘要：

```markdown
### Subagent Input
- payload_mode: compact-summary
- plan_path:
- task_id:
- step_scope:
- changed_files_summary:
- evidence_refs:
- required_output_contract:
```

要求：

- `payload_mode:` 默认使用 `compact-summary`
- `changed_files_summary:` 只列出本轮真正相关的文件组和变更摘要
- `evidence_refs:` 指向 handoff、plan、spec、关键文件路径，而不是内联大段内容
- `required_output_contract:` 明确要求返回完整 handoff

#### Prompt Budget 约束

- `prompt-budget`：优先传摘要、路径、handoff 引用和关键 watchpoints
- `do-not-inline-full-file-list`：不要把几十个文件路径原样展开到 subagent prompt，除非这些文件都必须逐个审查
- 不要重复粘贴 agent 定义中已经稳定存在的规则
- 不要同时内联全量 diff、全量文件内容和详细流程说明

#### Timeout-aware Retry

- `timeout-aware-retry`：第一次失败后，先判断是否属于 payload 过重、上下文过长或工具执行超时
- `narrowed-payload-retry`：重试时必须收窄 payload，只保留：
  - 当前 `task_id`
  - 最关键的 `step_scope`
  - 最小 `changed_files_summary`
  - 1 到 3 个 `evidence_refs`
  - 明确的 handoff 输出契约
- 不要原样重放更长的 prompt 去赌第二次会成功

### Loop Budget

Subagent 模式允许自动回流，但必须有明确预算和升级边界。主 agent 在 `Run Trace` 中维护以下计数：

```markdown
### Loop Budget
- review_loop_count:
- test_loop_count:
- challenge_loop_count:
- max_review_loops: 2
- max_test_loops: 2
- max_challenge_loops: 1
- loop_budget_exceeded: true | false
```

处理规则：

- `review_loop_count` 每发生一次 Reviewer `REJECTED -> Developer fix` 增加 1。
- `test_loop_count` 每发生一次 Tester `REJECTED -> Developer fix` 增加 1。
- `challenge_loop_count` 每发生一次 Challenger `REFUTED/UNVERIFIED -> 补证据/补计划/补验证` 增加 1。
- 任一计数超过对应 `max_*_loops` 时，设置 `loop_budget_exceeded=true`，停止自动回流，进入 `BLOCKED` 或升级到 `Team`。
- 同一问题第二次出现时，必须把 recurrence candidate 交给 `feedback-curator`，不能继续只做局部修补。
- 每次回流后必须重新经过导致回流的 gate；例如 Reviewer 修复后重跑 Reviewer，Tester 修复后重跑 Tester，Challenger 补证据后重跑 Challenger Gate。

### 循环定义

| 循环 | 条件 | 动作 |
|------|------|------|
| Dev → Reviewer | REJECTED + low risk | `feedback-curator` 记录阻塞反馈，主 agent 自动回到实现修复并继续循环 |
| Dev → Reviewer | REJECTED + medium/high risk | `feedback-curator` 记录阻塞反馈，主 agent 停止自动修改，把风险保留到最终确认或显式 gate |
| Dev → Reviewer | APPROVED | 进入 Tester |
| Tester | REJECTED + low risk | `feedback-curator` 记录阻塞反馈，主 agent 自动回到实现修复并继续循环 |
| Tester | REJECTED + medium/high risk | `feedback-curator` 记录阻塞反馈，主 agent 停止自动修改，把风险保留到最终确认或显式 gate |
| Tester | APPROVED | 进入 Architect 维护 |
| Challenger | REFUTED | 回到产生 claim 的角色修正计划、实现、测试证据或完成声明 |
| Challenger | UNVERIFIED + blocking_threshold 命中 | 补证据或补验证；若超过 `max_challenge_loops` 则 `BLOCKED` |
| 任一 gate | loop_budget_exceeded=true | 停止自动回流，升级到 `Team` 或交付前显式汇报阻塞状态 |

**终止条件**：Reviewer APPROVED + Tester APPROVED

补充约束：

- `Reviewer APPROVED` 的前提是 handoff 有效；空返回或无效 handoff 不能被当作通过
- `Tester APPROVED` 必须来自有效 Tester handoff；构建成功、服务可启动或主 agent 自述都不能替代
- 只有 `Reviewer APPROVED` 或合法 `main-agent-fallback` 后，才能进入 Tester

### 并行审查

- 可临时起意开启多个 Reviewer 并行审查同一份代码
- 结果汇总给主 agent

## Team 模式调用流程

```
主 agent
    ↓
创建 Agent Team
    ↓
多个 Reviewer 并行审查
    ↓
结果汇总
    ↓
后续流程同 Subagent 模式
```

## 模式选择建议

| 模式 | 核心特征 | 何时使用 |
|------|---------|---------|
| Skill | 单 agent 显式 workflow | 任务短、边界清楚、无需独立 reviewer |
| Subagent | 多角色串行 handoff | 需要 reviewer / tester 门禁和状态追踪 |
| Team | 并行多视角审查 | 需要多个 reviewer 并行给结论 |

## 交接文档

每个角色完成后必须写交接文档，格式见下方统一格式。
交接文档用于主 agent 读取结果、决定下一步操作。
开始执行前，主 agent 应先读取 `docs/memory/index.md` 和 `docs/memory/feedback/prevents-recurrence.md`。

Skill 模式不要求多角色 handoff，但仍必须产出上文的 `Skill Workflow Record`。`Subagent` / `Team` 模式则继续使用本节交接文档格式。

## 反馈决策规则

- **阻塞型反馈**：Reviewer 或 Tester 给出 `REJECTED` 时，主 agent 必须先触发 `feedback-curator` 记录到 `docs/memory/feedback/agent-feedback.md`。只有 `risk_level=low`、`operation_risk` 属于 `read-only` 或 `reversible-write`，且 `action_type` 属于自动执行白名单时，才自动回到实现修复后继续主流程。
- **自动执行白名单**：`code_fix`、`test_fix`、`doc_sync` 且 `scope=local_file` 或 `scope=cross_module` 但无外部副作用，且 `operation_risk` 不高于 `reversible-write`。
- **自动执行黑名单**：`workflow_rule`、`repo_rule`、`external`、删除文件、迁移脚本、发布/部署、权限或网络相关变更、任何 `irreversible-write`、任何 `external-side-effect`。
- **非阻塞反馈**：Reviewer 或 Tester 在 `APPROVED` 状态下给出的改进建议，也应先由 `feedback-curator` 记录；主流程可以继续，但在最终交付前统一向用户汇总。
- **最终确认**：用户只在最终交付时统一确认产物、验证结果、剩余风险和未自动执行建议。
- **显式 gate**：若计划动作是 `irreversible-write` 或 `external-side-effect`，则不等待“最终统一确认”兜底，而是在执行前产出 `Operation Gate` 请求用户明确确认。
- **同类问题累计 2 次或以上**：除记录反馈外，`feedback-curator` 还应更新 `docs/memory/feedback/prevents-recurrence.md` 中的提名或统计，并在最终交付摘要中提示主 agent 评估是否升级规范。
- **抽象要求**：`Feedback Record` 记录的是抽象后的问题模式和规则；原始 lint / test / review 输出留在角色专项输出和 `evidence` 中，不直接进入长期 memory。

## Tester 运行时验证规则

- Tester 必须先探测项目技术栈和可用验证入口，再建立测试矩阵
- Tester 不得把“项目缺少统一脚本”当作跳过验证的理由
- 当存在多个候选命令时，Tester 选择最项目原生、最贴近本轮变更范围的命令，并在交接文档中说明
- 当无法可靠判断可执行命令时，Tester 必须把已探测到的事实汇总给用户，请用户确认
- Tester 输出必须同时覆盖：已执行验证、环境假设、未覆盖风险

## Feedback Curator 接入点

- **交接后触发**：Reviewer 或 Tester 的交接文档中包含有效 `Feedback Record` 时立即触发 `feedback-curator`
- **交付前触发**：当前任务准备交付前再次触发 `feedback-curator`，汇总自动处理轨迹、尚未执行的建议和剩余风险
- **职责边界**：`feedback-curator` 可以写 memory 文件，但不得直接修改业务代码、Skill、Agent 定义或 `AGENTS.md`

## 统一交接文档格式

```markdown
## 交接：[from] → [to]

### 任务上下文
- plan_path: ...
- task_id: ...
- step_scope: ...
- spec_refs: ...
- handoff_source: ...

### Run Trace
- trace_id: ...
- current_phase: ...
- last_handoff: ...
- last_result: ...
- last_failure_reason: ...
- resume_entry: ...

### 完成内容
- files_touched: ...
- commands_run: ...
- artifacts: ...

### 结果
- status: APPROVED / REJECTED / BLOCKED
- blocking: true / false

### 角色专项输出
- ...

### Open Questions
- ...

### 建议
- ...

### Feedback Record
source: reviewer | tester | self-check | none
type: correction | improvement | issue | none
pattern: ...
rule: ...
action_type: code_fix | test_fix | doc_sync | workflow_rule | risk_note | none
risk_level: low | medium | high | none
operation_risk: read-only | reversible-write | irreversible-write | external-side-effect | none
scope: local_file | cross_module | repo_rule | external | none
content: ...
suggestion: ...
prevents_recurrence: true | false

### 状态
APPROVED / REJECTED / BLOCKED
```

当没有新增反馈时，`Feedback Record` 填写 `source: none`。
角色可在“角色专项输出”中扩展各自字段，但必须保留上述公共骨架，确保主 agent 和 `feedback-curator` 能稳定消费。

**单独调用时的行为**：

当 agent 独立使用时（不通过 workflow），交接文档作为报告格式输出给用户。

## 调用方式

用户通过自然语言描述需求：
- "用 Skill 模式完成这次小范围文档更新"
- "帮我用 developer 实现这个功能"
- "启动完整流程：dev → reviewer → tester"
- "开 3 个 reviewer 并行审查这段代码"

主 agent 根据复杂度决定使用 Skill / Subagent / Team 中的哪一种模式；如果选择后发现复杂度超出当前模式边界，应显式升级。

## 计划完成处理

实施计划完成后：
- 将计划从 `docs/exec-plans/active/` 移动到 `docs/exec-plans/completed/`
- 在 git 中提交状态变更

## 与现有流程的衔接

```
用户需求
    ↓
brainstorming（如需）
    ↓
writing-plans → 实施计划 → dev-workflow
    ↓
交付
```

## 扩展点

1. **领域 Skill**：后续可加入 react-dev、vue-dev 等，Developer agent 调用
2. **Team 模式完善**：多角色并行协作
3. **状态追踪**：交接文档与 `Skill Workflow Record` 持久化到 git
