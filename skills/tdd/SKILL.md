---
name: tdd
description: 用于实现行为变更、修复 bug、重构或新增边界处理前执行测试驱动开发；当 /pm-orchestrator 要求 TDD，或 /developer 开始代码实现 slice 时使用。
---

# TDD

`tdd` 定义 RED / GREEN / REFACTOR 纪律。它不选择业务范围，不替代 `/tester`，也不做最终 code review；它只保证实现前有能证明目标行为的测试证据。

## Source

本 skill 改编自 Superpowers `test-driven-development`，并吸收 Addy Osmani `agent-skills` 中的 Prove-It Pattern、测试金字塔、DAMP over DRY 和 incremental implementation 思路。来源、license 和本地改动记录在 `references/source.md`。

## 何时使用

- 新功能、bugfix、重构、行为变更、边界条件处理。
- `/pm-orchestrator` 的 PM policy 标记 `tdd_required: true`。
- `/developer` 即将修改生产代码，且本次 slice 会改变运行行为。
- 需要证明 bug 已复现再修复。

## 何时不要使用

- 纯文档、纯注释、纯配置、格式化、安装产物同步，且 PM 允许 TDD exception。
- 生成代码或一次性 spike，但必须在结果中记录 `tdd_exception`。
- 已实现行为的独立验收：使用 `/tester`。

## 输入 / 读取项

- 当前 plan task / slice、acceptance criteria、spec refs。
- 相关源文件、相邻测试、测试配置和 package/tooling 文件。
- `/developer` 或 PM 提供的技术栈识别结果。
- 失败输出和修复后的验证输出。

## 执行流程

1. 确认当前 slice 是否是行为变更；不是行为变更时输出 `tdd_exception`。
2. 建立 acceptance checklist：逐条列出本 slice 的验收条件，并标记每条准备用哪个测试证明。
3. RED：写一个最小、具体、能表达目标行为或 bug 的测试。优先让一个 RED test 只证明一个主要行为；如果一个测试覆盖多条验收，必须说明哪些断言在 RED 中实际执行并失败。
4. Verify RED：运行最小相关测试，确认失败原因是目标行为缺失或 bug 存在，而不是语法错误、导入错误或测试写错。
5. RED 过宽时先收窄：如果失败输出混杂多个原因、第一条断言阻止后续验收被执行，或无法判断失败对应哪条 acceptance，先拆分/收窄测试再进入 GREEN。
6. GREEN：写最小实现让该测试通过，不做计划外重构或额外功能。
7. Verify GREEN：重新运行同一测试，并按风险运行相邻测试。
8. REFACTOR：只有在 GREEN 后才清理命名、重复和局部结构；每次 refactor 后重新验证。
9. 输出结构化 TDD evidence。无法找到测试入口、RED 失败原因不正确、GREEN 无法通过或需求不清时返回 `BLOCKED`。

## 输出格式

```markdown
### TDD Result
- capability: tdd
- source_skill: /tdd
- slice:
- tdd_required: true / false
- tdd_exception:
- acceptance_coverage:
  - criterion:
    red_evidence:
    green_evidence:
    status: RED_VERIFIED / GREEN_ONLY / NOT_COVERED
- red_test:
- red_command:
- red_result:
- green_changes:
- green_command:
- green_result:
- refactor:
- adjacent_verification:
- status: PASS / FAIL / BLOCKED
```

## 暂停 / 阻塞条件

- 无法确定目标行为或验收标准。
- 找不到可运行测试入口，且 repo 没有可推断测试命令。
- RED 测试立即通过。
- RED 失败不是因为目标行为缺失。
- GREEN 需要扩大 scope、改架构或触碰 PM 未授权文件。

## Feedback / Memory Boundary

TDD 失败和修复证据默认只进入本轮 handoff evidence。只有重复出现的 TDD 违规、用户明确要求记录，或发现会约束未来类似任务的流程规则时，才交给 `/feedback-curator` 判断是否持久化。
