# 用户反馈记录

> 用户反馈优先级最高 — 无需询问，直接记录并应用。

## 记录规范

每条反馈记录以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，格式 `uf-YYYYMMDD-NNN` |
| `date` | 反馈日期 (ISO 8601) |
| `session` | 会话上下文（项目/功能名称） |
| `type` | `correction` / `preference` / `request` / `complaint` |
| `content` | 原始反馈内容 |
| `action` | 采取的行动 |
| `applied` | 是否已应用 (`true`/`false`) |
| `prevents_recurrence` | 是否需要写入规范防止再犯 |

## 已记录的反馈

<!-- 新反馈追加在此处，按日期倒序 -->

