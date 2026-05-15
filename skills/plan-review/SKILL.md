---
name: plan-review
description: 用于 /writing-plans 产出 active exec plan 后、实现前的只读计划审核；当 /pm-orchestrator 判断计划跨模块、高风险、多阶段、包含并行 lane，或用户要求 fresh-eyes plan review 时使用。
---

# Plan Review

`plan-review` 是实现前的 fresh-eyes gate。它不替代 `/writing-plans`，也不直接修改计划；它只审核 active exec plan 是否足够让另一个 agent 不猜测地执行。

## Source

本 skill 改编自 `dsifry/metaswarm` 的 `plan-review-gate` 和 adversarial plan review rubric。执行时不需要读取 source 仓库；来源、license 和本地改动记录在 `references/source.md`。

## 何时使用

- `/pm-orchestrator` 接收到 `/writing-plans` 产出的 active exec plan，且任务跨模块、跨阶段、高风险或包含并行 lane。
- plan 涉及 public API、数据模型、迁移、权限、安全、支付、发布、CI/CD、UI/e2e 或不可逆操作。
- spec 和 plan 来自不同会话，存在 drift 风险。
- 用户或 PM 明确要求 fresh-eyes plan review。

## 何时不要使用

- 用户还在探索需求：先用 `/brainstorming`。
- 尚未写出实施计划：先用 `/writing-plans`。
- 小型低风险修复，PM policy 判定无需额外 gate。
- 需要审查已实现代码：使用 `/reviewer` 或专项 review pack。
- 需要测试已实现行为：使用 `/tester`。

## 输入 / 读取项

- 用户当前请求和已确认 spec / design doc。
- `docs/exec-plans/active/*.md` 中要审核的计划。
- 计划引用的 `docs/design-docs/`、`docs/product-specs/` 或其他 spec refs。
- `AGENTS.md`、`docs/memory/index.md`、`docs/memory/feedback/prevents-recurrence.md`，如果计划或 PM policy 指向这些约束。
- 计划中声明的文件路径、命令、测试入口和 docs impact。

## 执行流程

1. 确认 plan path、spec refs 和审核范围；缺失 plan 时输出 `BLOCKED`。
2. 用 feasibility lens 检查计划是否能在当前 repo、工具链、权限和 runtime 约束下执行。
3. 用 completeness lens 检查每条关键需求、非目标和验收标准是否能映射到具体任务、测试和文档收口。
4. 用 scope / alignment lens 检查计划是否超出已确认需求、绕过 `/brainstorming` 决策或引入第二套事实源。
5. 用 fresh-eyes lens 检查任务是否有精确文件、代码 / 文案内容、测试命令、预期结果和清晰顺序，另一个 agent 是否能不猜测地执行。
6. 检查 TDD discipline：新行为是否先写失败测试，再实现，再验证通过；纯文档或配置任务必须说明 TDD 例外。
7. 检查 ambiguity：搜索 `TBD`、`TODO`、占位符、模糊动作、未定义 API、未确认命令和未声明依赖。
8. 检查 execution safety：并行 lane 是否文件 ownership 不冲突，高风险动作是否有 gate，docs impact 是否有收口。
9. 输出结构化 handoff。发现会导致实现者猜测、构建错误内容或跳过验证的问题时，返回 `REJECTED`。

## 输出格式

```markdown
### Review Handoff
- capability: plan_review
- source_skill: /plan-review
- files_reviewed:
- spec_refs:
- findings:
- risk_level: low / medium / high
- operation_risk: read-only
- required_fixes:
- optional_suggestions:
- evidence:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- 没有可读取的 active plan。
- plan 引用的关键 spec 缺失，且无法从用户请求中恢复需求。
- plan 和用户确认的需求冲突，需要用户或 `/writing-plans` 重新确认。
- 计划包含高风险外部副作用，但没有 PM operation gate。

## Feedback / Memory Boundary

`plan-review` 的发现默认是本轮 handoff evidence，不直接写入长期 memory。只有重复出现的计划缺陷、用户明确要求记录，或发现会约束未来类似任务的流程规则时，才交给 `/feedback-curator` 判断是否持久化。

## 可调用 Skills

无。由 `/pm-orchestrator` 调度；若 `REJECTED`，PM 回流 `/writing-plans` 修订计划。
