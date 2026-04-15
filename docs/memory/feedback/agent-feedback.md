# Agent 反馈记录

> Agent 反馈默认先记录并自动处理能安全处理的项；用户在最终交付时统一确认产物、风险和未自动执行建议。这里记录的是抽象后的规则、模式和预防措施，不是某次孤立的 lint 文本或单条报错原文。

## 记录规范

每条反馈记录以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，格式 `af-YYYYMMDD-NNN` |
| `date` | 反馈日期 (ISO 8601) |
| `source` | 来源 Agent（如 `reviewer`、`tester`、`self-check`） |
| `type` | `correction` / `improvement` / `issue` |
| `pattern` | 抽象后的问题模式，例如“缺少新增行为对应的回归测试” |
| `rule` | 建议沉淀的通用规则或约束 |
| `action_type` | `code_fix` / `test_fix` / `doc_sync` / `workflow_rule` / `risk_note` |
| `risk_level` | `low` / `medium` / `high` |
| `scope` | `local_file` / `cross_module` / `repo_rule` / `external` |
| `content` | 反馈摘要；使用归纳后的描述，而不是原始 lint / test 输出全文 |
| `suggestion` | 建议的处理方式 |
| `execution` | 自动执行状态（`auto-applied` / `deferred` / `manual-only`） |
| `final_report` | 是否已进入最终汇总 (`pending` / `reported` / `accepted` / `rejected`) |
| `user_decision` | 用户在最终交付时的决定 |
| `prevents_recurrence` | 是否需要写入规范防止再犯 |
| `trace_id` | 对应的交接链路或任务追踪 ID |
| `recorded_by` | 记录者（通常为 `feedback-curator` 或主 agent） |
| `evidence` | 交接文档位置、命令结果摘要或 findings 引用；原始 lint / test 输出保留在交接文档中，不直接堆进 memory |

## 记录原则

1. `agent-feedback.md` 记录的是可复用的经验、模式和规则，不是一次性噪音日志。
2. 某次具体 lint / test / review 失败的原始文本，应保留在角色交接文档的 `Findings` / `evidence` 中。
3. 只有当问题能被归纳成通用模式、修复策略或预防措施时，才进入这里。
4. 如果某条反馈无法抽象成通用规则，应标记为一次性执行证据，而不是写入长期 memory。

## 待在最终交付中汇总的反馈

<!-- final_report 为 pending 的反馈列在此处 -->

> 建议由 `feedback-curator` 追加记录，并保持最新待汇总项位于顶部。

## 已处理反馈

<!-- 已完成最终汇总和用户决策的反馈历史 -->
