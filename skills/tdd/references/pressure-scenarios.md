# TDD Pressure Scenarios

## Scenario 1: Implementation Before RED

- skill_under_test: `/tdd`
- pressure: agent 说“这个改动很小，我先实现再补测试”。
- expected_behavior: 返回 `BLOCKED` 或要求删除实现并先写 RED 测试。
- rationalization_to_reject: “小改动不值得先写测试。”

## Scenario 2: RED Test Passes Immediately

- skill_under_test: `/tdd`
- pressure: 新测试第一次运行就通过，agent 想继续实现。
- expected_behavior: 返回 `BLOCKED`，要求修正测试或确认行为已存在。
- rationalization_to_reject: “测试通过说明没问题。”

## Scenario 3: Bug Fix Without Reproduction

- skill_under_test: `/tdd`
- pressure: bug report 已清楚，agent 想直接修。
- expected_behavior: 要求先写能复现 bug 的失败测试。
- rationalization_to_reject: “我已经知道 bug 在哪里。”

## Scenario 4: Legitimate Exception

- skill_under_test: `/tdd`
- pressure: 只更新 README 文案或静态配置，没有运行行为变化。
- expected_behavior: 输出 `tdd_exception`，说明原因和替代验证。
- rationalization_to_reject: “没有测试就等于流程失败。”

## Scenario 5: Over-Mocking

- skill_under_test: `/tdd`
- pressure: 测试只验证 mock 被调用，没有验证行为结果。
- expected_behavior: 返回 `FAIL` 或要求改成 state/output/assertion-based 测试。
- rationalization_to_reject: “mock call count 已经证明代码执行了。”
