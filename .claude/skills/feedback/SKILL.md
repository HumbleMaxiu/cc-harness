---
name: feedback
description: 提交用户反馈、纠正、偏好、请求或投诉；当用户想“提 feedback”“反馈一下”“记录这个意见”“把这个问题记下来”时使用。适合自然语言输入，负责分类、落账到 user-feedback memory，并明确是否需要防止再犯。
---

# 提交反馈

把用户给出的自然语言反馈整理成结构化记录，写入 `docs/memory/feedback/user-feedback.md`，并推动当前会话立即按反馈执行。

## 何时使用

当用户表达以下意图时使用：

- “我想提个 feedback”
- “帮我记一下这个问题”
- “这个体验不对 / 不好用”
- “以后应该怎样做”
- “把这个要求记录到项目里”

优先处理 **用户反馈**，而不是 Reviewer / Tester / 自检产生的 Agent 反馈。

## 不要把它当成什么

- 不要把 `/feedback` 当成反馈历史查询入口
- 不要把 `/feedback` 当成任意知识库搜索入口
- 不要要求用户先手动填写完整字段表格

如果用户要查历史、做汇总、看 recurrence，改用 `/feedback-query`。

## 最小执行流程

1. 读取 `docs/memory/index.md`，确认 feedback memory 的事实来源
2. 读取 `docs/feedback/feedback-collection.md` 与 `docs/memory/feedback/user-feedback.md`
3. 从用户原话中抽取：
   - `type`: `correction` / `preference` / `request` / `complaint`
   - `content`: 保留用户意图，压缩无关赘述
   - `action`: 当前会话立即采取的动作
   - `prevents_recurrence`: 是否应提名到规范层
4. 生成新的 `uf-YYYYMMDD-NNN`
5. 将新记录追加到 `user-feedback.md` 顶部
6. 立即按反馈推进当前工作；除非动作本身属于高风险操作，否则不要额外要求确认

## 分类提示

- `correction`
  - 用户指出事实、实现或判断有误
- `preference`
  - 用户给出偏好、风格或沟通方式要求
- `request`
  - 用户提出新能力、流程或体验改进请求
- `complaint`
  - 用户明确表达不满、受阻或体验下降

如果同时满足多个类型，优先选择最能代表用户动机的一个。

## 记录要求

- `session` 应写当前任务或主题的短标签
- `content` 要保留“用户为什么在意这件事”
- `action` 要写本轮已执行或将立即执行的处理动作
- `applied` 默认为 `true`，只有当前确实无法执行时才写 `false`
- 如果该问题可能重复出现，设置 `prevents_recurrence = true`，并在最终总结里提示是否需要升级规范

## 输出

完成后给出简短结果：

```markdown
### Feedback Capture Result
- record_id:
- type:
- applied:
- prevents_recurrence:
- next_action:
```

保持简洁，重点是“已记录什么、已开始做什么”。
