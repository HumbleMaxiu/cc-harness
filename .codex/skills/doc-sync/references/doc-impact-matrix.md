# Doc Impact Matrix

## 用途

`docs_impact_matrix` 用于把“哪些文档需要同步”从隐式判断变成显式输入。

## 推荐格式

```markdown
### Docs Impact Matrix
- update:
- review_only:
- maybe_follow_up:
- rationale:
```

## 字段说明

- `update`
  - 本轮应立即同步的文档
- `review_only`
  - 需要检查，但大概率无需修改的文档
- `maybe_follow_up`
  - 需要后续进一步确认或补齐的文档
- `rationale`
  - 为什么这些文档受影响

## 使用规则

- 如果上游已提供 matrix，优先消费，不要重新发明一套口径
- 如果上游未提供，`/doc-sync` 应基于变更文件和现有规范做最小版本 matrix
- 即使没有明确 `update` 项，也应保留 `review_only`

## 最小示例

```markdown
### Docs Impact Matrix
- update:
  - AGENTS.md
  - docs/design-docs/index.md
- review_only:
  - ARCHITECTURE.md
- maybe_follow_up:
  - docs/product-specs/agent-system.md
- rationale:
  - 新增顶级 skill，需同步 skill 列表、设计文档索引，并确认架构与产品规格是否受影响
```
