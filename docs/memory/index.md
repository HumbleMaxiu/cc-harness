# Memory Index

项目记忆统一收敛到 `docs/memory/`，避免工作记忆散落在仓库根目录之外。

## 读取顺序

1. 先看本文件，了解有哪些记忆可用
2. 再看 `docs/memory/feedback/prevents-recurrence.md`，优先加载硬约束
3. 如需了解最近偏好或待处理问题，再看 `docs/memory/feedback/user-feedback.md` 和 `docs/memory/feedback/agent-feedback.md`
4. 如需追溯历史趋势或已完成汇总的旧反馈，再看 `docs/memory/feedback/archive/`

## 反馈相关

- [用户反馈](feedback/user-feedback.md) — 经过分诊后，确认为 durable、跨任务可复用的用户反馈
- [Agent 反馈](feedback/agent-feedback.md) — 来自 Reviewer、Tester 或自检的问题，由 `feedback-curator` 或主 agent 记录
- [防止再犯](feedback/prevents-recurrence.md) — 已升级为规范的重复问题和预防措施
- [Feedback Archive](feedback/archive/index.md) — 已完成汇总的历史反馈趋势和月度归档

## 使用原则

- `docs/memory/` 是记忆的事实来源
- 新会话和 `/compact` 恢复时优先读取这里，而不是依赖口头上下文
- 重复问题必须从记录升级为规则，而不只是停留在日志里
- 长期记忆应保持可恢复、可扫描；旧反馈应定期 roll up 到 archive，而不是无限堆积在活跃 memory 中

## 与 Run Trace 的边界

- `docs/memory/` 负责保存跨任务可复用的长期事实
- 当前任务做到哪一阶段、最近跑了什么命令、为什么中断，优先写入任务层 `Run Trace`
- 恢复时先读 memory 了解约束，再读 `Run Trace` 定位当前阶段；两者不能互相替代
- 原始终端输出、临时调试细节和一次性失败文本，不应直接堆进长期 memory
- 当前任务里的实现说明、验收补充、测试同步和 session-only 指令，也不应直接写进长期 memory
