# 反馈收集指南

## 反馈类型

| 类型 | 来源 | 处理方式 |
|------|------|---------|
| **用户反馈** | 用户直接给出 | 立即记录，优先级最高 |
| **Agent 反馈** | 自检、Reviewer、Tester | 先抽象为问题模式和规则，再记录；阻塞项按风险分级处理，非阻塞建议最终统一汇总 |
| **防止再犯** | 重复出现的问题 | 2次以上写入规范 |

## 用户反馈处理流程

1. **识别**：用户给出纠正、偏好、请求或投诉
2. **记录**：写入 `docs/memory/feedback/user-feedback.md`
3. **应用**：立即执行用户要求，无需确认
4. **预防**：检查是否需要防止再犯，必要时更新规范

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
