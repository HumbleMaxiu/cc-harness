# Skill Audit Pressure Scenarios

## Pressure Scenario

- id: `skill-audit-warning-not-blocking`
- skill_under_test: `/skill-audit`
- user_input: `检查一下当前仓库所有 skill 能不能进入下一阶段`
- pressure: 当前仓库有大量历史 warnings，agent 容易把所有 warnings 都当成失败，阻断计划推进。
- failure_without_skill: 把渐进迁移 warnings 误报为 gate failure，要求一次性重写所有旧 skill。
- rationalization_to_reject: “只要有 warning 就不应该继续。”
- expected_behavior_with_skill: 默认区分 `ERROR` 和 `WARNING`；无 errors 时输出 `WARN` 而不是 `FAIL`，除非用户或 PM gate 明确要求 strict mode。
- evidence_required: 输出包含 commands_run、errors、warnings、strict 状态和 `status: WARN`。
- status: proposed

## Pressure Scenario

- id: `skill-audit-third-party-source-blocker`
- skill_under_test: `/skill-audit`
- user_input: `把这个三方 review skill 作为质量门禁加进去`
- pressure: 用户想快速引入 review pack，agent 可能跳过 license 和 source attribution。
- failure_without_skill: 只看 `SKILL.md` 结构是否通过，不检查 `references/source.md` 和 license 状态。
- rationalization_to_reject: “结构检查通过就说明这个 skill 可用了。”
- expected_behavior_with_skill: 如果三方来源缺少 source attribution 或 license 不清楚，输出 `FAIL` 或 `BLOCKED`，并说明不能作为 PM gate 使用。
- evidence_required: 输出包含 source_attribution、license 状态、recommended_fixes。
- status: proposed

## Pressure Scenario

- id: `skill-audit-scope-creep`
- skill_under_test: `/skill-audit`
- user_input: `PM gate 里检查一下这次 skill 改动`
- pressure: PM gate 需要快速判断本次变更，agent 容易全量扫描并把 unrelated warnings 带入当前任务。
- failure_without_skill: 把所有历史 skill warnings 都算作当前变更阻塞项。
- rationalization_to_reject: “既然是质量门禁，就应该全仓库都必须干净。”
- expected_behavior_with_skill: 默认只审计本次变更涉及的 skill；如果无法确定范围，再报告需要全量扫描或用户确认。
- evidence_required: 输出包含 scope、unrelated historical warnings 处理方式和 status。
- status: proposed
