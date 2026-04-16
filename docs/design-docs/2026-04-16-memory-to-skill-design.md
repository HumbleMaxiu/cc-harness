# Memory To Skill 升级设计

> **状态**：已实现
> **日期**：2026-04-16

## 目标

让 `cc-harness` 中的长期记忆不只停留在 feedback 和 recurrence，而是在出现稳定、重复、可复用的 workflow 时，进一步升级为 project-local skill。

## 问题

当前仓库已经有：

- 用户反馈
- Agent 反馈
- 防止再犯

但“什么时候该从一条规则升级成一个 skill”还没有明确路径。这会导致：

- 经验停留在文档里，难以直接复用
- recurring pattern 只能被提醒，不能被能力化
- `skill-creator` 缺少来自 memory 的高信号输入

## 设计结论

### 结论 1：feedback / recurrence 先于 skill

不是所有问题都该直接长成 skill。先进入 feedback 和记忆层，等模式足够稳定后再升级。

### 结论 2：需要显式的 Skill Promotion Candidate

当某类 recurring pattern 已具备稳定 workflow 时，用统一结构记录：

```markdown
### Skill Promotion Candidate
- source_record:
- recurring_pattern:
- candidate_skill_name:
- recommended_scope:
- status:
```

### 结论 3：由 `/feedback-query` 查询，由 `/skill-creator` 执行创建

- `/feedback-query` 负责查看 candidate
- `/skill-creator` 负责真正把 candidate 变成 skill

这样“记忆层”和“能力层”各自边界清楚，又能顺畅衔接
