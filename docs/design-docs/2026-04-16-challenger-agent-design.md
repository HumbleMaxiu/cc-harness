# Challenger Agent 设计文档

> **状态**：已实现
> **日期**：2026-04-16

## 目标

新增一个 `challenger` 角色，用于对计划、claim、API 假设和完成声明做对抗式验证，补齐 `reviewer` 和 `tester` 之间的空档。

## 问题

现有流程里：

- `reviewer` 更偏代码质量、规范和安全
- `tester` 更偏验证入口、测试执行和覆盖缺口

但“某个计划是否建立在未经验证的假设上”“某个 API 真的这样工作吗”“完成声明是否有足够证据”这类问题，没有独立角色负责。

## 设计结论

### 结论 1：Challenger 不是第二个 Reviewer

它不重复做代码风格或测试矩阵，而是专门处理：

- 计划中的关键 claim
- 设计论证中的假设
- API / 外部事实是否真实成立
- “已完成”是否有足够证据

### 结论 2：Challenger 只挑战，不直接改代码

它的价值在于尽早指出证据缺口与风险，而不是把问题吞进实现中自己修。

### 结论 3：应在两个时机接入

1. 计划形成后、实现前
2. Agent 声称完成，但结论依赖复杂推断或外部 claim 时

## 输出格式

每个关注点使用固定结构：

```markdown
- CLAIM:
- CHALLENGE:
- VERIFICATION:
- VERDICT: CONFIRMED / REFUTED / UNVERIFIED
```

这样主 agent 可以稳定消费，并决定是继续、补验证还是阻塞回退。
