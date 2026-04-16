# Harness Behavior Evals

> 用行为级 fixture 验证 harness 的“实际效果”，而不是只验证文档里写了什么。

## 目标

行为级 eval 要回答：

1. 在给定输入仓库状态和任务时，harness 产出的最终结果是否正确？
2. 关键轨迹是否符合 workflow / feedback / gate 约束？
3. 自动修复、升级、停止条件是否按风险模型执行？

## Fixture 结构

```text
fixtures/repos/<scenario-id>/
  scenario.json
  task.md
  input/
  grader.js
  samples/
    <sample-id>/
      sample.json
      submission/
```

## 评分原则

- 优先看最终仓库状态，而不是只看最后一句总结
- 同时检查结果与轨迹
- 对高风险动作要显式判定 gate 是否正确触发
- 每个场景至少保留一个应通过样例和一个应失败样例

## Runner 用法

```bash
# 运行全部行为级 eval 自检样例
node scripts/checks/harness-behavior-evals.js

# 只跑一个 fixture
node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop

# 只跑一个样例
node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop --sample pass-low-risk

# 给真实 harness 输出打分
node scripts/checks/harness-behavior-evals.js \
  --fixture reviewer-rejected-loop \
  --submission /abs/path/to/submission
```

## grader.js 约定

`grader.js` 必须导出：

```js
module.exports = {
  async grade(context) {
    return {
      passed: true,
      summary: '...',
      findings: [],
    };
  },
};
```

`context` 可用字段：

- `fixtureId`
- `scenario`
- `task`
- `fixtureDir`
- `initial.*`：读取 `input/` 快照
- `submission.*`：读取待评分提交结果
- `assert(condition, message)`
- `assertIncludes(content, snippet, label)`

## 首个基线场景

`reviewer-rejected-loop` 已提供第一个完整样板，展示如何评估：

- `REJECTED + low risk` 是否先入 memory
- 是否只对白名单中的低风险动作自动修复
- 是否正确恢复到下一个 workflow 阶段
- 是否阻止 `irreversible-write` 被误当作可自动执行
