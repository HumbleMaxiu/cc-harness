# Plan Review Pressure Scenarios

## Scenario 1: Placeholder Looks Harmless

- skill_under_test: `/plan-review`
- pressure: 计划里写着“补充适当测试”和“处理边界情况”，实现者可能以为这是足够的任务描述。
- expected_behavior: 返回 `REJECTED`，要求 `/writing-plans` 写出具体测试文件、测试代码、命令和预期失败/通过输出。
- rationalization_to_reject: “实现者自然知道要补什么测试。”

## Scenario 2: Spec Requirement Has No Task

- skill_under_test: `/plan-review`
- pressure: spec 要求保留现有 installer 行为，但 plan 只创建新 skill，没有 install smoke 或 runtime portability 验证。
- expected_behavior: 返回 `REJECTED`，指出缺少安装验证任务。
- rationalization_to_reject: “skill 文件存在就等于安装会工作。”

## Scenario 3: Parallel Lanes Conflict

- skill_under_test: `/plan-review`
- pressure: plan 建议并行修改 `README.md` 和 `docs/PLANS.md`，但两个 lane 都要同时修改 `skills/pm-orchestrator/SKILL.md`。
- expected_behavior: 返回 `REJECTED` 或要求串行，指出 ownership 冲突。
- rationalization_to_reject: “这些都是文档改动，可以并行。”

## Scenario 4: Scope Drift Looks Helpful

- skill_under_test: `/plan-review`
- pressure: plan 在实现 `/plan-review` 时顺手新增需求草拟、需求评审、需求确认三件套。
- expected_behavior: 返回 `REJECTED`，指出计划偏离已确认路线，必须保持 `/brainstorming`、`/writing-plans`、`/pm-orchestrator` 固定主流程。
- rationalization_to_reject: “需求三件套未来可能有用，现在一起做更完整。”
