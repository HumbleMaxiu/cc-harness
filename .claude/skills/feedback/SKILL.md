---
name: feedback
description: 分诊并提交用户反馈：只有 durable、跨任务可复用的偏好、约束或流程反馈才写入长期 memory；当前任务内的一次性指令应留在任务上下文。适用于“提 feedback”“记录这个意见”“以后都这样”等场景。
---

# 反馈分诊与记录

把用户给出的自然语言输入先分诊，再决定是否写入 `docs/memory/feedback/user-feedback.md`。本 Skill 的目标不是“看到意见就记一条”，而是把真正 durable、跨任务可复用的用户反馈沉淀到长期 memory，同时把当前任务内的一次性指令留在任务上下文。

## 核心契约

- 触发 `/feedback` 不等于一定写 `user-feedback.md`
- 长期 memory 只存 **durable preferences / constraints / workflow feedback**
- 当前任务的实现说明、验收补充、UI 微调、测试同步、临时环境细节，留在当前任务上下文，不进长期 memory
- 查询历史、统计、recurrence 或 skill candidate 时，改走 `/feedback-query`
- Reviewer / Tester / 自检产出的结构化问题，不属于本 Skill 的用户反馈记录范围
- 如果一句话同时包含长期反馈和当前任务指令，先拆开；只记录长期那部分

## 何时使用

当用户表达以下任一意图时使用：

- “我想提个 feedback”
- “帮我记一下这个问题”
- “这个体验不对 / 不好用”
- “以后应该怎样做”
- “把这个要求记录到项目里”
- “以后类似任务都按这个规则做”
- “记住我的这个偏好 / 约束”

它是 **用户反馈入口**，不是 Agent 反馈入口。

## 何时不要使用

- 用户要查历史、看 summary、搜 recurrence、看 candidate：改用 `/feedback-query`
- 输入明显来自 Reviewer / Tester / 自检结构化输出：走 Agent 反馈流
- 用户只是在推进当前任务、没有表达“记录/反馈”意图，且内容明显是 task-local 指令：继续当前 workflow，不必强行调用本 Skill

## 分诊结果

每次执行本 Skill，必须先把输入归到下面 4 类之一：

1. `long_term_feedback`
   - durable、跨任务可复用的偏好、约束、规则、体验反馈
   - 写入 `user-feedback.md`
2. `task_local_note`
   - 只影响当前任务、当前页面、当前 PR、当前测试
   - 不写长期 memory；留在当前任务上下文
3. `redirect_feedback_query`
   - 用户要查历史、summary、recurrence、skill candidate
   - 不写入；改走 `/feedback-query`
4. `agent_feedback`
   - 来源是 Reviewer / Tester / 自检问题
   - 不写 `user-feedback.md`；转到 Agent 反馈处理规则

## 判定顺序

按下面顺序判断，命中后立即停止：

1. `query_intent?`
   - 用户是在查记录，而不是提记录吗？
   - 是：`redirect_feedback_query`
2. `agent_feedback_source?`
   - 输入来自 Reviewer / Tester / 自检结论吗？
   - 是：`agent_feedback`
3. `task_local_only?`
   - 内容是否只影响当前任务的实现、验收、测试或临时环境？
   - 是：`task_local_note`
4. `workflow_or_experience_feedback?`
   - 是否在评价 agent、workflow、harness 或长期协作体验？
   - 是：`long_term_feedback`
5. `durable_preference_or_rule?`
   - 是否会影响未来类似任务的偏好、约束、流程或判断标准？
   - 是：`long_term_feedback`
6. `explicit_record_but_ambiguous?`
   - 用户明确要“记一下/记录”，但内容还不清楚是否 durable？
   - 先尽量抽象；如果抽象后仍然只适用于当前任务，则归 `task_local_note`

一句话标准：

`只有 durable 且跨任务可复用的内容，才允许进入长期 feedback memory。`

## 排除条件

满足任一条件时，默认 **不记录** 为长期用户反馈：

- 只影响当前任务、当前页面、当前 PR、当前测试
- 是一次性 UI、实现、文案、数据、接口或测试调整
- 是临时环境信息、临时路径、临时测试数据或一次性 workaround
- 是 verbatim 文案、模板、原始长文本，而不是可复用结论
- 是用户当前回合的操作指令，而不是对未来协作的长期约束
- 是“按这个改”的局部要求，但没有表达“以后都这样”或“这是长期偏好/规则”

## 混合输入处理

如果一段话同时包含“当前任务指令”和“长期反馈”，必须拆开处理：

- 当前任务指令：留在当前任务 spec、Run Trace、验收标准或测试更新
- 长期反馈：抽象后写入 `user-feedback.md`

示例：

- “这次 legend 颜色跟线统一，另外以后类似图表都不要再让图例和线颜色不一致”
  - 前半句：当前任务指令，不入长期 memory
  - 后半句：长期规则，可以记录
- “帮我记一下：这个页面这次 Y 轴颜色用现在这个值”
  - 用户虽然说了“记一下”，但内容只适用于当前页面当前改动
  - 结果：`task_local_note`，不写入 `user-feedback.md`

## 执行流程

1. 读取 `docs/memory/index.md`，确认 feedback memory 的事实来源
2. 读取 `docs/feedback/feedback-collection.md` 与 `docs/memory/feedback/user-feedback.md`
3. 先做分诊，产出 `route`
4. 如果 `route = redirect_feedback_query` 或 `route = agent_feedback`，只输出简短路由结果，不写 `user-feedback.md`
5. 如果 `route = task_local_note`：
   - 不写长期 memory
   - 明确告诉调用方“仅在当前任务上下文应用”
6. 如果 `route = long_term_feedback`，再做一次质量筛选：
   - 只保留 durable 的偏好、约束、流程经验
   - 删除一次性 task context、长段 verbatim 文本和临时参数
   - 如果内容本质上只是 instruction-shaped payload，除非它已被明确抽象成未来规则，否则不要写入长期 memory
7. 从用户原话中抽取：
   - `type`: `correction` / `preference` / `request` / `complaint`
   - `content`: 保留用户意图与“为什么在意”，优先抽象为可复用经验，而不是只复述现象
   - `action`: 当前会话立即采取的动作；如果已经形成稳定做法，写明沉淀到哪条规则、文档或 workflow
   - `prevents_recurrence`: 是否应提名到规范层
8. 生成新的 `uf-YYYYMMDD-NNN`
9. 将新记录追加到 `user-feedback.md` 顶部
10. 立即按反馈推进当前工作；除非动作本身属于高风险操作，否则不要额外要求确认

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
- `content` 要保留“用户为什么在意这件事”，并尽量抽象成后续可复用的经验、判断或约束
- `action` 要写本轮已执行或将立即执行的处理动作；如果已经升级为规范、文档或 skill 方向，要明确写出
- `applied` 默认为 `true`，只有当前确实无法执行时才写 `false`
- 如果该问题可能重复出现，设置 `prevents_recurrence = true`，并在最终总结里提示是否需要升级规范
- 不要把 `user-feedback.md` 写成逐条抱怨列表；长期 memory 应优先保留可恢复、可复用的结论
- 不记录敏感信息、密钥、个人隐私数据或不必要的精确环境细节

## 输出契约

### 1. 不写长期 memory

当 `route = task_local_note / redirect_feedback_query / agent_feedback` 时，输出：

```markdown
### Feedback Triage Result
- route:
- captured: false
- reason:
- next_action:
```

### 2. 写入长期 memory

当 `route = long_term_feedback` 时，输出：

```markdown
### Feedback Capture Result
- record_id:
- route: long_term_feedback
- type:
- applied:
- prevents_recurrence:
- next_action:
```

## 示例

### 应写入长期 memory

- “以后做类似图表时，图例颜色必须和线颜色对应”
- “这个 workflow 的体验很差，别再把查询和提交入口混在一起”
- “记住：我更偏好短总结，不要每次都给很长解释”

### 不应写入长期 memory

- “这次把 Y 轴颜色改成我现在这个”
- “把这个按钮右移 8px”
- “这个测试断言跟着当前 DOM 结构改一下”

保持简洁，重点是“分诊正确，再决定是否沉淀 memory”。
