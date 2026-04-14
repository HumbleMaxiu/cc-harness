# Memory Index

项目记忆统一收敛到 `docs/memory/`，避免工作记忆散落在仓库根目录之外。

## 读取顺序

1. 先看本文件，了解有哪些记忆可用
2. 再看 `docs/memory/feedback/prevents-recurrence.md`，优先加载硬约束
3. 如需了解最近偏好或待处理问题，再看 `docs/memory/feedback/user-feedback.md` 和 `docs/memory/feedback/agent-feedback.md`

## 反馈相关

- [用户反馈](feedback/user-feedback.md) — 用户直接给出的纠正、偏好、请求或投诉
- [Agent 反馈](feedback/agent-feedback.md) — 来自 Reviewer、Tester 或自检的问题
- [防止再犯](feedback/prevents-recurrence.md) — 已升级为规范的重复问题和预防措施

## 使用原则

- `docs/memory/` 是记忆的事实来源
- 新会话和 `/compact` 恢复时优先读取这里，而不是依赖口头上下文
- 重复问题必须从记录升级为规则，而不只是停留在日志里
