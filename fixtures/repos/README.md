# Harness Eval Fixtures

最小 eval fixture 集合。当前每个场景使用 `scenario.json` 描述：

- 输入仓库状态
- 用户请求
- 预期产物
- 关键失败信号
- 必须存在的路径
- 必须满足的核心断言

当前 `scripts/checks/harness-evals.js` 会读取这些 manifests 并执行最小回归检查。
