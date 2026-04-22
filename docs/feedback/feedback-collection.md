# 反馈收集指南

## 反馈类型

| 类型 | 来源 | 处理方式 |
|------|------|---------|
| **用户反馈** | 用户直接给出 | 先分诊；只有 durable 项进入长期 memory |
| **Agent 反馈** | 自检、Reviewer、Tester | 先抽象为问题模式和规则，再记录；阻塞项按风险分级处理，非阻塞建议最终统一汇总 |
| **防止再犯** | 重复出现的问题 | 2次以上写入规范 |

## 用户反馈处理流程

1. **分诊**：先判断输入应进入 `long_term_feedback`、`task_local_note`、`redirect_feedback_query` 还是 `agent_feedback`
2. **记录**：只有 `long_term_feedback` 才通过 `/feedback` 写入 `docs/memory/feedback/user-feedback.md`
3. **应用**：无论是否写入长期 memory，都应把当前回合需要执行的动作落实到正确位置
4. **预防**：检查是否需要防止再犯，必要时更新规范

### 用户反馈记录原则

- 先判断这句话是在修改“当前任务怎么做”，还是在表达“以后类似任务都应该怎么做”
- 只有跨任务可复用的经验、偏好、规则、流程意见，才进入长期 `user-feedback.md`
- 如果只是当前任务内的实现细节、UI 调整、文案改法、颜色选择、数据映射、测试同步或验收口径，默认不要写入长期 feedback memory，而是落到当前任务 spec、Run Trace、验收标准或测试更新中
- 当用户明确说“提 feedback”“记录这个意见”“以后都这样”“以后不要再这样”时，应优先按用户反馈处理
- 长期 memory 应优先保存 durable 的偏好、约束和流程反馈，不要保存一次性 task context
- 不要把 instruction-shaped 的本轮操作指令直接升级成长期规则；只有它明确针对未来类似任务时才允许记录
- 即便用户显式说“记一下”，如果内容仍然只适用于当前任务，也应落到任务上下文，而不是强行写进长期 memory
- `user-feedback.md` 不应退化成逐条问题流水账
- 记录时优先保留可复用的经验、判断、约束或 workflow 改进
- `content` 应写出用户为什么在意这件事，而不是只复述表面现象
- `action` 应尽量写成已经落地的改法、规则或后续可复用做法
- 如果当前反馈还无法抽象成经验，才保留更具体的问题描述，但仍应避免堆原始对话全文

### 推荐判定顺序

按以下顺序判断是否写入 `user-feedback.md`：

1. 用户是否其实在查历史或做 summary；如果是，转 `/feedback-query`
2. 内容是否来自 Reviewer / Tester / 自检；如果是，转 Agent 反馈流
3. 内容是否只影响当前任务；如果是，归 `task_local_note`
4. 内容是否在评价 agent、workflow、harness 或协作体验；如果是，归长期用户反馈
5. 内容是否会约束未来类似任务的长期偏好、规则或判断标准；如果是，归长期用户反馈
6. 如果以上都不是，则默认视为当前任务上下文，不进入长期 memory

### 混合输入处理

如果一段输入同时包含长期反馈和当前任务指令：

- 先拆分
- 只把长期、可复用的部分写入 `user-feedback.md`
- 把任务内细节留在 spec、Run Trace、验收标准或测试更新中

### 记录排除项

以下内容默认不应进入长期 `user-feedback.md`：

- 一次性 UI、实现、文案、接口、数据或测试调整
- 当前任务、当前页面、当前 PR 才成立的细节
- verbatim 模板、大段原话、原始终端输出
- 临时环境参数、路径、测试账号、工作区 workaround
- 敏感信息、密钥、个人隐私数据

### `/feedback` 的正确心智模型

- `/feedback` 是“反馈分诊 + 记录入口”，不是“调用一次就必须写一条 memory”
- 对 task-local 内容，正确处理是 `captured: false`，而不是为了凑记录去污染长期 memory
- 对真正 durable 的长期反馈，才进行结构化落账

### 不应记录为用户反馈的常见场景

- 当前任务里说“这个按钮再往右一点”“这个图例颜色和线对齐”
- 当前页面里说“文案改成我现在这句”
- 当前实现里说“测试用例跟着现在的颜色/结构一起改”
- 当前需求里补充一次性的接口、字段、样式或交互细节

这些内容应进入当前任务的实现说明、验收标准或测试调整，而不是长期 feedback memory。

### 应记录为用户反馈的常见场景

- 用户明确要求“帮我记个 feedback”“把这个问题记到项目里”
- 用户在评价 agent / workflow / harness 的体验问题
- 用户提出以后类似任务都应遵守的长期偏好或规则
- 用户纠正了一个会影响后续类似工作的通用判断标准

### 推荐入口

- 用户要“提 feedback”“记录意见”“反馈一个问题”时，优先使用 `/feedback`
- 用户要查历史、看统计、找 recurrence 时，使用 `/feedback-query`
- 不应要求用户先手动描述一整套字段，再由 agent 被动转写

## Agent 反馈处理流程

1. **识别**：Agent 自检发现问题，或 Reviewer/Tester 返回 `REJECTED`，或在 `APPROVED` 下提出改进建议
2. **抽象**：先把原始问题归纳成“问题模式 + 通用规则 + 风险等级”，不要直接把 lint / test 原始文本写进长期 memory
3. **记录**：写入 `docs/memory/feedback/agent-feedback.md`，标注自动执行状态与最终汇总状态
3. **分类**：
   - 低风险反馈（通常为局部代码、测试、文档同步）→ 主 agent 可自动修复并继续流程
   - 中高风险反馈（跨模块、删除/迁移、外部副作用、规范升级）→ 记录并保留到最终总结或显式 gate
   - 非阻塞建议（`APPROVED` 下的改进项）→ 当前主流程可继续，在最终交付前统一向用户汇总
4. **执行/拒绝**：只有 `risk_level=low`、`operation_risk` 不高于 `reversible-write`，且 `action_type` 在自动执行白名单内的项默认自动修复；其余项进入最终总结或显式 gate
5. **归档**：更新自动执行状态和最终用户决定
6. **预防**：检查是否需要防止再犯
7. **滚动归档**：当 `agent-feedback.md` 开始积累过多已完成记录时，将历史项 roll up 到 `docs/memory/feedback/archive/YYYY-MM.md`

### Skill 模式补充

- `dev-workflow` 的 `Skill 模式` 也会产生 Agent 反馈，即便没有独立 Reviewer / Tester handoff
- Skill 模式中的反馈事实来源是 `Skill Workflow Record` 里的 `Self Review`、`Verification` 和 `Final Summary`
- 只要这些区块中出现结构化 `feedback_record`，主 agent 或 `feedback-curator` 就应按与 Subagent 模式相同的规则写入 `docs/memory/feedback/agent-feedback.md`
- 这意味着 Skill 模式不是“没有反馈记录的轻量模式”，而是“单 agent 产出结构化反馈的 workflow 模式”

## Feedback Rollup / Archive

### 目标

- 让活跃 memory 保持短、小、可恢复
- 让 archive 保留历史趋势、代表性模式和规则升级轨迹
- 避免把长期记忆变成逐条错误日志

### Rollup 规则

1. `agent-feedback.md` 主要保留：
   - `final_report = pending` 的待汇总项
   - 最近一段时间刚完成处理的记录
   - 仍影响当前规范判断的少量代表性样本
2. 已完成处理且不再影响当前决策的旧记录，应按月 roll up 到 `docs/memory/feedback/archive/YYYY-MM.md`
3. 月度归档只保留：
   - 高频问题模式
   - 代表性修复类型
   - 已升级为 `prevents-recurrence` 的规则
   - 未关闭的跨任务风险
4. 原始证据不进入 archive；保留在交接文档和 `evidence` 引用中
5. 归档输出使用固定顺序：`月度概览` → `代表性问题模式` → `升级到 Prevents-Recurrence` → `备注`

### 触发时机

- 交付前发现 `agent-feedback.md` 已明显变长
- 月末或 `/compact` 前整理长期记忆
- `feedback-curator` 在处理一批已完成反馈时顺手进行

## 运行时集成

- `docs/memory/index.md` 是反馈记忆入口，也是会话恢复时的默认读取点
- SessionStart hook 当前会注入 `using-brainstorming` skill，也会附带 `docs/memory/index.md`、`docs/memory/feedback/prevents-recurrence.md` 以及可用的 feedback 快照，帮助新会话获得最小恢复上下文
- 即便 hook 已注入 memory 快照，workflow 和各角色仍应把 `docs/memory/` 视为事实来源；需要更完整上下文时继续显式读取原文件，而不是只依赖 hook 注入片段
- Skill 模式执行时，主 agent 必须在最终交付前整理 `Skill Workflow Record`，作为恢复、memory 写入和最终汇总的事实来源
- Reviewer / Tester 若发现问题，必须在交接文档中输出结构化的 `Feedback Record`，以便主 agent 追加到 `docs/memory/feedback/agent-feedback.md`
- Skill 模式若在 `Self Review` / `Verification` 中发现问题，也必须输出结构化的 `feedback_record`，再决定自动修复、升级模式或进入最终汇总
- `feedback-curator` 负责消费 `Feedback Record`，维护 `agent-feedback.md`，并在需要时更新 `prevents-recurrence.md` 中的提名或统计
- `feedback-curator` 在执行前应先读取 `docs/feedback/feedback-collection.md` 和 `docs/memory/index.md`，否则视为未完整加载约束
- `REJECTED` 反馈属于阻塞项，但是否自动修复要看 `risk_level`、`operation_risk` 和 `action_type`；`APPROVED` 下的建议项可以在最终交付前统一汇总
- `risk_level` 表示问题严重性；`operation_risk` 表示建议动作的执行风险。对于 `irreversible-write` / `external-side-effect`，主 agent 必须先输出 `Operation Gate` 并等待确认
- 主流程的阻塞点由 `dev-workflow` 控制，而不是由 hook 或 shell 层面拦截控制
- Tester 的验证入口探测属于运行时职责：先探测项目事实，再运行可执行验证，必要时询问用户
- 当同类问题累计 2 次或以上时，主 agent 必须同步更新 `docs/memory/feedback/prevents-recurrence.md` 和相应规范文件
- 当活跃 feedback 文件开始变长时，主 agent 或 `feedback-curator` 必须将已完成项归档到 `docs/memory/feedback/archive/`

## 反馈优先级

1. 用户反馈 — 立即执行
2. Reviewer/Tester 的阻塞型 `REJECTED` — 记录后自动修复回流
3. Reviewer/Tester 的非阻塞建议、自检发现的问题 — 记录后在最终交付统一汇总
4. 重复问题 — 升级为防止再犯规范

## 防止再犯标准

当以下任一条件满足时，必须将预防措施写入规范：
- 同一类型问题出现 2 次或以上
- 问题导致用户体验显著下降
- 问题有明确的技术解决方案

写入位置：
- `AGENTS.md` — 全局行为规则
- 相关 Agent 定义文件 — 特定角色的规则
- `docs/RELIABILITY.md` — 可靠性相关规范

## Memory → Skill 升级路径

当某类问题不只是需要“防止再犯”，而是已经形成稳定、可复用的处理流程时，应进一步考虑升级为 project-local skill。

### 触发条件

- 同类问题在 feedback / recurrence 中出现 `>= 2` 次
- 修复或处理动作已经稳定，能抽象为重复 workflow
- 已能明确描述输入、输出、边界和不适用场景

### 记录方式

当满足上述条件时，在相关反馈或 recurrence 记录旁增加：

```markdown
### Skill Promotion Candidate
- source_record:
- recurring_pattern:
- candidate_skill_name:
- recommended_scope:
- status: proposed / accepted / created / rejected
```

### 后续动作

- 只需要查询和评估时，可通过 `/feedback-query` 查看候选项
- 一旦确定要创建 skill，转交 `/skill-creator`
- 未升级为 skill 前，仍保留在 feedback / prevents-recurrence 体系中，不要直接跳过记忆层
