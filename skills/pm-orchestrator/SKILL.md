---
name: pm-orchestrator
description: PM 总控层。用于计划后或长任务中进行阶段控制、skill 分配、失败回流、并行/串行策略、Run Trace 和交付 gate 编排；当用户要从需求推进到实现、审查、测试、文档同步或上线前检查时使用。
---

# PM Orchestrator

`pm-orchestrator` 是 `cc-harness` 的执行总控层。它不替代 role skills，而是根据任务阶段、风险、依赖和验证证据决定何时调用哪些 skill、哪些步骤必须串行、哪些工作可以并行，以及失败后应该回流到哪里。

## 何时使用

- 用户已有明确 specification、design doc、active exec plan 或 Goal Contract，需要开始执行。
- 用户要做长任务、跨多阶段任务、AI coding 流程或“一条命令，从需求到上线”的交付流程。
- 用户需要 PM 判断下一阶段该用哪些 skills、review packs、quality gates。
- 实现、review、test、docs sync、feedback 或 CI/CD 任一阶段失败，需要结构化回流。
- `/writing-plans` 完成计划后需要进入执行。
- `/follow-goal` 建立 durable objective 后需要推进 checkpoint。

## 何时不要使用

- 用户还在发散想法、需求不清或需要探索方案：先用 `/brainstorming`。
- 用户只需要编写实施计划且尚未执行：先用 `/writing-plans`。
- 用户只想手动同步文档：直接用 `/doc-sync`。
- 用户只想做交付前单次质量门禁：直接用 `/harness-quality-gate`。
- 用户只想审计 skill：直接用 `/skill-audit`。
- 一个很小、低风险、无歧义的 vibe coding 修改可以由主执行者直接完成，但仍要保留必要验证和 docs impact 判断。

## 输入 / 读取项

按任务需要读取：

- 用户当前请求和最近上下文
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/exec-plans/active/`
- `docs/design-docs/`
- `docs/product-specs/`
- `docs/memory/index.md`
- `docs/memory/feedback/prevents-recurrence.md`
- `docs/references/review-pack-registry.md`
- 相关 role skill 的 `SKILL.md`

如果任务范围很小，可以只读取与当前阶段直接相关的文件，并在输出中说明未读取的范围。

如果上述 docs 在安装后的目标项目中不存在，PM 不应阻塞启动；应使用用户请求、当前仓库结构和已安装 skill contract 继续执行，并把缺失 docs 记录为 `docs_impact` 或 `follow_up`。如果 `docs/references/review-pack-registry.md` 不存在，则跳过 review pack 自动选择，只使用明确可用的 review / test / gate skills。

## 执行流程

### Phase 1: Intake And Stage Detection

1. 判断当前入口来自用户请求、spec、active plan、Goal Contract、失败回流还是交付前检查。
2. 确定当前阶段：
   - intake
   - requirements
   - planning
   - architecture
   - implementation
   - review
   - test
   - docs sync
   - feedback
   - quality gate
   - CI/CD
   - final handoff
3. 确认是否需要用户决策。需求不清、范围冲突或高风险动作未确认时不要继续写代码。

### Phase 2: Build Execution Policy

为当前阶段写出最小 PM policy：

```markdown
### PM Execution Policy
- objective:
- current_stage:
- risk_level:
- operation_risk:
- required_skills:
- optional_skills:
- serial_steps:
- parallel_candidates:
- gates:
- stop_conditions:
```

`operation_risk` 取值：

- `read-only`
- `reversible-write`
- `local-history-write`
- `irreversible-write`
- `external-side-effect`

常见动作分类：

- 普通文件编辑：`reversible-write`
- 创建或修改只运行测试、lint、typecheck、build 的 CI workflow：`reversible-write`
- `git commit`：`local-history-write`
- 删除不可恢复数据、重写公共历史或破坏性迁移：`irreversible-write`
- `git push`、发布、发消息、创建外部 issue / ticket：`external-side-effect`
- CI workflow 包含 deploy、release、package publish、environment approval、OIDC、secrets 或写权限 token：`external-side-effect`

`local-history-write` SHOULD 进入 Operation Gate，除非用户已经明确要求提交。`irreversible-write` 和 `external-side-effect` MUST 先进入 Operation Gate。commit 和 push 必须分开判断；允许 commit 不代表允许 push。

### Phase 3: Route Skills By Stage

默认 routing：

| Stage | Primary skill | Optional support |
|---|---|---|
| unclear goal / creative scope | `/brainstorming` | `/harness-guide` |
| implementation plan | `/writing-plans` | `/plan-review` for high-risk or multi-stage plans, `/architect` |
| architecture and docs impact | `/architect` | `/challenger` |
| implementation | `/developer` | `/tdd` for behavior changes, `/tester` for independent verification |
| CI setup or workflow edit | `/developer` | `/review-github-actions`, `/tester`, `/ci-cd-gate` after PR/push |
| code review | `/reviewer` | review packs, `/challenger` |
| verification | `/tester` | `/harness-quality-gate` |
| skill changes | `/skill-creator` or direct edit | `/skill-audit` |
| docs impact | `/doc-sync` | `/architect` |
| feedback / recurrence | `/feedback-curator` | `/feedback`, `/feedback-query` |
| CI/CD status and failure triage | `/ci-cd-gate` | `/tester`, `/review-github-actions`, `/review-security` |
| final release readiness | `/harness-quality-gate` | `/ci-cd-gate` when PR/CI context exists |

不要为了形式化而调用无关 skill。PM 的职责是选择合适强度，而不是让每个任务都跑满流程。

### Review Pack Scheduling

PM keeps `/reviewer` as the default code review skill and adds review packs by risk:

- auth, permission, secrets, tenant boundary, payment, external request, SQL/shell/template execution, dependency risk: add `/review-security`.
- `.github/workflows/**`, `action.yml`, `.github/actions/**`, workflow-loaded scripts, or AI agent actions in CI: add `/review-github-actions`.
- UI components, forms, navigation, loading/error/empty states, accessibility, responsive layout or visual behavior: add `/review-frontend`.
- hot paths, queries, pagination, cache, API fan-out, large lists, bundle size or expensive render/computation: add `/review-performance`.

Multiple review packs may run in parallel because they are read-only, but PM must aggregate their `Review Handoff` results before deciding whether to backflow to `/developer`.

### CI/CD Gate Scheduling

PM SHOULD route to `/ci-cd-gate` when:

- user asks whether CI, GitHub Actions, PR checks, build, release, or deploy is ready.
- `/tester` passes locally but remote checks are failing, pending, stale, or unknown.
- final handoff depends on PR checks or release readiness.
- CI failure needs classification before assigning `/developer`, `/tester`, `/review-github-actions`, or `/review-security`.

`/ci-cd-gate` is read-only. Rerun workflow, push fix, post PR comment, merge, release, or deploy remain `external-side-effect` operations and require Operation Gate confirmation.

### CI Setup Scheduling

PM MAY assign CI workflow creation or edits to `/developer` when the slice is explicit and file ownership includes `.github/workflows/**`, `action.yml`, `.github/actions/**`, or workflow-loaded scripts.

For a basic CI workflow that only runs existing tests, lint, typecheck, or build:

- set `operation_risk: reversible-write`.
- set `files_allowed` to the exact workflow/config paths.
- set `tdd_exception_allowed: true` because this is config-only.
- require `/developer` to identify stack commands from repo config, not invent new commands.
- require `/review-github-actions` after the workflow edit.
- require `/tester` to run the local commands referenced by the workflow when feasible.
- require `/ci-cd-gate` after PR/push when remote CI evidence exists.

If the workflow includes deploy, release, package publish, environment approval, OIDC, secrets, write permissions, or any external system write, PM MUST run Operation Gate before implementation and treat the action as `external-side-effect`.

### Plan Review Gate

PM 默认不为每个计划强制调度 `/plan-review`。满足任一条件时 SHOULD 调度：

- 跨模块、跨阶段或多角色 handoff。
- 涉及 public API、数据模型、迁移、权限、安全、支付、发布、CI/CD、UI/e2e 或不可逆操作。
- 计划包含并行 lane 或高风险 operation gate。
- spec 与 plan 来自不同会话，或 PM 发现需求 / 计划可能 drift。
- 用户明确要求 fresh-eyes plan review。

`/plan-review` 返回 `APPROVED` 后才能进入 implementation。返回 `REJECTED` 时回流 `/writing-plans`；返回 `BLOCKED` 时 PM 汇报 blocker 和需要的输入。

### TDD Policy

PM 默认对行为变更、bugfix、refactor 和边界条件处理设置 `tdd_required: true`。满足以下任一条件时 MAY 允许 `tdd_exception`：

- 纯文档、纯注释、纯格式化或静态配置。
- 生成代码或 spike，且用户明确接受后续补测试。
- 当前 repo 没有可运行测试入口，PM 决定先完成最小实现并把测试缺口交给 `/tester` 或后续计划。

`/developer` 执行 slice 时负责调用 `/tdd` 协议或记录 TDD exception。`/tester` 做实现后的独立验证，不替代 `/tdd` 的 RED/GREEN/REFACTOR 证据。

当 PM 允许 docs-only / config-only 的 `tdd_exception` 时，SHOULD 要求 `/developer` 输出例外原因和证据。证据可以是 scoped diff、hash、命令输出或文件列表，用于证明生产代码或运行行为未被该 slice 改动。

PM 汇总 TDD evidence 时，不只看测试最终通过，还要检查 acceptance coverage：每条验收条件应标明 `RED_VERIFIED`、`GREEN_ONLY` 或 `NOT_COVERED`。核心行为变更缺少 RED evidence 时，回流 `/developer` with `/tdd`；只有低风险补充断言或历史行为可接受 `GREEN_ONLY`，并应在风险说明中写清楚。

### Phase 4: Decide Serial Or Parallel

默认串行执行以下内容：

- 需求、范围和用户确认
- 高风险写入
- 架构决策
- 修改同一文件或强依赖的实现任务
- 失败恢复
- 最终完成声明

只有同时满足以下条件才允许并行：

- 每条 lane 有明确、互不重叠的文件 ownership
- 依赖已满足
- 每条 lane 有清晰输出 contract
- wave 后有验证步骤
- 当前 host 支持安全委派，或主会话能以可追踪方式顺序模拟

PM wave 格式：

```markdown
### PM Wave
- wave_id:
- objective:
- mode: serial / parallel
- execution_mode: executed / dry-run / simulated-parallel
- assigned_skills:
- lane_ownership:
- dependencies:
- expected_outputs:
- verification_after_wave:
```

当 host 不支持真实并行或当前会话选择顺序模拟并行时，使用 `execution_mode: simulated-parallel`，并明确：

- 每个 lane 的文件 ownership
- 实际执行顺序
- 哪些 evidence 是 simulated，哪些是 executed
- wave 后的统一 verification

### Phase 5: Execute And Verify Each Stage

1. 按 PM policy 执行当前阶段。
2. 每个 role skill 或 review pack 返回结构化 handoff。
3. PM 汇总 evidence，而不是只接受“完成了”的声明。
4. 进入下一阶段前确认：
   - 必需输出已产生
   - 验证命令已运行或说明无法运行原因
   - docs impact 已判断
   - failure backflow 没有未处理 blocker

### Phase 6: Failure Backflow

失败回流规则：

| Failure | Backflow target |
|---|---|
| unclear requirement | `/brainstorming` or user confirmation |
| plan missing steps | `/writing-plans` |
| plan review rejected | `/writing-plans` |
| plan review blocked | PM clarification or `/brainstorming` when requirements are unclear |
| architecture/docs impact unclear | `/architect` |
| implementation bug | `/developer` |
| TDD red invalid or missing | `/developer` with `/tdd` |
| test entry missing | PM decision, then `/developer` with exception or `/tester` |
| developer scope expansion | PM clarification or `/writing-plans` when plan ownership is wrong |
| test failure due product behavior ambiguity | PM clarification, then `/developer` or `/tester` |
| test failure due test expectation drift | `/tester`, then PM decision |
| review finding | `/developer` or relevant review pack |
| CI test/lint/typecheck/build failure | `/ci-cd-gate` classifies, then `/developer` or `/tester` |
| CI workflow/config failure | `/ci-cd-gate`, then `/review-github-actions` and `/developer` |
| CI secret/permission/security failure | `/ci-cd-gate`, then `/review-security` plus `/review-github-actions`, or user decision |
| CI pending or stale | `/ci-cd-gate` returns `PENDING` / `STALE`; PM cannot claim release-ready |
| missing docs update | `/doc-sync` |
| skill standard failure | `/skill-creator` then `/skill-audit` |
| repeated failure without new evidence | PM blocks and reports options |

同一 root cause 连续失败两次且没有新证据时，PM 必须停下并汇报 blocker、可选路径和推荐路径。

### Phase 7: Final Gate And Handoff

收尾前：

1. 运行最相关的 repo-native checks。
2. 判断是否需要 `/harness-quality-gate`。
3. 判断 docs 是否需要 `/doc-sync`。
4. 判断 review / test / self-check feedback 是否需要 `/feedback-curator`。
5. 汇总完成项、验证证据、未覆盖风险和下一步。

### Phase 8: Feedback And Memory Boundary

PM 可以识别 feedback impact，但不要直接把当前任务的一次性实现说明、测试同步、临时失败或验收补充写入长期 memory。

只有以下情况才调度 `/feedback-curator`、`/feedback` 或 `/feedback-query`：

- 用户显式要求记录反馈。
- 用户评价 workflow、harness、skill 或 PM 编排行为。
- finding 会约束未来类似任务。
- 同类问题重复出现，可能需要 recurrence 或 prevents-recurrence。

Reviewer、Tester 和 self-check 的发现先作为 handoff evidence；只有满足长期反馈条件时，才进入 feedback memory。

区分两层记录：

- `handoff_evidence`：当前任务的审查、测试、失败、修复和日志证据，可以用于本轮回流和最终总结。
- `long_term_memory_write`：会影响未来任务行为的持久规则，只能在满足长期反馈条件时写入 memory。

存在 `Feedback Record` 不等于必须写长期 memory。PM 必须先判断 `memory_write_decision`，再决定是否调度 `/feedback-curator` 做持久化。

## 输出格式

PM 必须维护可恢复的 trace：

```markdown
### PM Run Trace
- trace_id:
- source_request:
- current_stage:
- execution_mode: executed / dry-run / simulated-parallel
- active_plan:
- assigned_skills:
- current_wave:
- files_touched:
- commands_run:
- evidence:
- simulated_evidence:
- executed_evidence:
- failures:
- retry_count:
- docs_impact:
- feedback_impact:
- memory_boundary:
- next_resume_action:
```

阶段完成后输出：

```markdown
### PM Orchestrator Result
- status: PASS / WARN / BLOCK
- current_stage:
- execution_mode: executed / dry-run / simulated-parallel
- assigned_skills:
- waves:
- completed:
- failures:
- verification:
- simulated_evidence:
- executed_evidence:
- docs_impact:
- feedback_impact:
- memory_boundary:
- operation_gate:
- next_action:
```

Dry-run 输出必须明确：

```markdown
### PM Dry Run Result
- status: PASS / WARN / BLOCK
- simulated_steps:
- executed_steps:
- files_not_modified:
- commands_not_run:
- assumptions:
- evidence_limits:
- real_execution_next_steps:
```

Operation Gate 输出必须明确：

```markdown
### Operation Gate
- action:
- operation_risk: local-history-write / irreversible-write / external-side-effect
- target_paths_or_systems:
- expected_side_effects:
- reversibility:
- rollback_plan:
- confirmation_required: yes / no
- confirmation_status: pending / approved / rejected
- blocked_reason:
```

## 暂停 / 阻塞条件

必须暂停并请求用户决策：

- 用户目标、验收标准或范围互相冲突。
- 需要执行 `irreversible-write` 或 `external-side-effect`。
- 同一 root cause 失败两次且没有新证据。
- review / test / quality gate 发现高风险 blocker。
- 需要访问当前环境不可用的外部系统或凭据。
- PM 无法判断该并行还是串行，且错误选择会造成冲突或返工。

没有 evidence 时，不得声称任务完成。
