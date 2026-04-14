# Agent 反馈记录

> Agent 反馈执行前必须询问用户 — 记录但不自动应用。

## 记录规范

每条反馈记录以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，格式 `af-YYYYMMDD-NNN` |
| `date` | 反馈日期 (ISO 8601) |
| `source` | 来源 Agent（如 `reviewer`, `tester`, 自检） |
| `type` | `correction` / `improvement` / `issue` |
| `content` | 反馈内容 |
| `ask_user` | 是否已询问用户 (`pending`/`approved`/`rejected`) |
| `user_decision` | 用户的决定 |
| `prevents_recurrence` | 是否需要写入规范防止再犯 |

## 待询问用户的反馈

<!-- 状态为 pending 的反馈列在此处 -->

## 已处理反馈

<!-- 已询问用户的反馈历史 -->

