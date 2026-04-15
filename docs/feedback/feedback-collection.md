# 反馈收集指南

## 反馈类型

| 类型 | 来源 | 处理方式 |
|------|------|---------|
| **用户反馈** | 用户直接给出 | 立即记录，优先级最高 |
| **Agent 反馈** | 自检、Reviewer、Tester | 先记录；阻塞项立即询问，非阻塞建议收尾统一询问 |
| **防止再犯** | 重复出现的问题 | 2次以上写入规范 |

## 用户反馈处理流程

1. **识别**：用户给出纠正、偏好、请求或投诉
2. **记录**：写入 `docs/memory/feedback/user-feedback.md`
3. **应用**：立即执行用户要求，无需确认
4. **预防**：检查是否需要防止再犯，必要时更新规范

## Agent 反馈处理流程

1. **识别**：Agent 自检发现问题，或 Reviewer/Tester 返回 `REJECTED`，或在 `APPROVED` 下提出改进建议
2. **记录**：写入 `docs/memory/feedback/agent-feedback.md`，状态 `pending`
3. **分类**：
   - 阻塞型反馈（`REJECTED`）→ 立即向用户说明反馈内容，请求确认是否执行
   - 非阻塞建议（`APPROVED` 下的改进项）→ 当前主流程可继续，在任务收尾统一向用户汇总并询问
4. **执行/拒绝**：根据用户决定行动
5. **归档**：更新状态为 `approved` 或 `rejected`
6. **预防**：检查是否需要防止再犯

## 运行时集成

- `docs/memory/index.md` 是反馈记忆入口，也是会话恢复时的默认读取点
- SessionStart hook 会在新会话中注入 `docs/memory/index.md` 以及 `docs/memory/feedback/` 下的核心记录
- Reviewer / Tester 若发现问题，必须在交接文档中输出结构化的 `Feedback Record`，以便主 agent 追加到 `docs/memory/feedback/agent-feedback.md`
- `feedback-curator` 负责消费 `Feedback Record`，维护 `agent-feedback.md`，并在需要时更新 `prevents-recurrence.md` 中的提名或统计
- `REJECTED` 反馈属于阻塞项，主 agent 在记录后必须立即进入用户决策点；`APPROVED` 下的建议项可以在任务交付前统一汇总
- 当同类问题累计 2 次或以上时，主 agent 必须同步更新 `docs/memory/feedback/prevents-recurrence.md` 和相应规范文件

## 询问用户的话术模板

```
我收到来自 [{source}] 的反馈：
"{content}"

建议的处理方式：{suggestion}

是否同意执行此更改？（是/否）
```

## 反馈优先级

1. 用户反馈 — 立即执行
2. Reviewer/Tester 的阻塞型 `REJECTED` — 记录后立即询问用户
3. Reviewer/Tester 的非阻塞建议、自检发现的问题 — 记录后在合适的决策点询问用户
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
