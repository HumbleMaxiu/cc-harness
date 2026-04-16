# Sync Checklist

按需检查以下项目，并将结果写入 `Doc Sync Result`：

1. 相关 product spec 是否受影响
2. 相关 design doc 是否需要新增或更新
3. `ARCHITECTURE.md` 是否需要同步
4. `AGENTS.md` 的导航、skill 列表、规则是否需要同步
5. 对应 index 页面是否需要补链接
6. `docs/memory/` 或 `docs/feedback/` 的规则是否受影响
7. 是否存在“应有但缺失”的 supporting doc
8. 是否需要在 exec-plan、handoff 或 final summary 中记录 follow-up

## 输出要求

每个检查项最终应落入以下之一：

- `docs_updated`
- `reviewed_no_change`
- `missing_docs`
- `follow_up_needed`

不要只做口头判断，不留结构化结果。
