# Agent 反馈记录

> Agent 反馈默认先记录并自动处理能安全处理的项；用户在最终交付时统一确认产物、风险和未自动执行建议。

## 记录规范

每条反馈记录以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，格式 `af-YYYYMMDD-NNN` |
| `date` | 反馈日期 (ISO 8601) |
| `source` | 来源 Agent（如 `reviewer`、`tester`、`self-check`） |
| `type` | `correction` / `improvement` / `issue` |
| `content` | 反馈内容 |
| `suggestion` | 建议的处理方式 |
| `execution` | 自动执行状态（`auto-applied` / `deferred` / `manual-only`） |
| `final_report` | 是否已进入最终汇总 (`pending` / `reported` / `accepted` / `rejected`) |
| `user_decision` | 用户在最终交付时的决定 |
| `prevents_recurrence` | 是否需要写入规范防止再犯 |
| `recorded_by` | 记录者（通常为 `feedback-curator` 或主 agent） |
| `evidence` | 交接文档或命令结果等依据 |

## 待在最终交付中汇总的反馈

<!-- final_report 为 pending 的反馈列在此处 -->

> 建议由 `feedback-curator` 追加记录，并保持最新待汇总项位于顶部。

## 已处理反馈

<!-- 已完成最终汇总和用户决策的反馈历史 -->
