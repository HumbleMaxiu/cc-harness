# Harness Eval Fixtures

最小 eval fixture 集合。当前分为两层：

- `scenario.json`：文档/契约级 eval manifest
- `task.md` + `input/` + `grader.js` + `samples/`：行为级 eval fixture（逐步补齐）

## 文档级 eval

`scripts/checks/harness-evals.js` 会读取各场景的 `scenario.json`，验证：

- 输入/请求/失败信号等字段完整
- 所需路径存在
- 关键文档或 Skill 契约包含指定片段

这层回答的是：“规则有没有被写进 harness”。

## 行为级 eval

`scripts/checks/harness-behavior-evals.js` 会读取带 `grader.js` 的 fixture，并运行样例提交：

- `input/`：场景初始仓库快照
- `task.md`：要交给 harness/agent 的任务描述
- `grader.js`：这个场景的结果判分逻辑
- `samples/<sample-id>/sample.json`：期望 `pass` 或 `fail`
- `samples/<sample-id>/submission/`：模拟的最终提交结果

这层回答的是：“面对这个任务，harness 产出的结果和轨迹是不是符合预期”。

## 推荐结构

```text
fixtures/repos/<scenario-id>/
  scenario.json
  task.md
  input/
  grader.js
  samples/
    pass-*/
      sample.json
      submission/
    fail-*/
      sample.json
      submission/
```

## 常用命令

```bash
npm run check:evals
npm run check:behavior-evals
node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop
node scripts/checks/harness-behavior-evals.js --fixture reviewer-rejected-loop --sample pass-low-risk
```
