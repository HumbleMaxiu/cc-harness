---
name: feedback-query
description: 查询反馈历史、查看防止再犯条目、做摘要或审计；当用户想搜索 feedback、回看记录、做 summary 时使用，不作为主要的用户提反馈入口。
---

# 反馈查询

查询和管理用户反馈、Agent 反馈及防止再犯记录。

`/feedback-query` 负责 **查**，`/feedback` 负责 **提 + 分诊**。

## 查询命令

### 查询用户反馈
```
/feedback-query user [关键词]
```

### 查询 Agent 反馈
```
/feedback-query agent [关键词]
```

### 查询防止再犯记录
```
/feedback-query prevents [关键词]
```

### 查看所有反馈
```
/feedback-query all
```

### 统计摘要
```
/feedback-query summary
```

### 查看 Skill Promotion Candidate
```
/feedback-query skill-candidates
```

## 提交新反馈

当用户想直接提交新的项目反馈时，优先使用：

```text
/feedback
```

注意：

- `/feedback` 不保证一定写入 `user-feedback.md`
- 它会先判断该内容应进入长期 memory、当前任务上下文，还是其他反馈处理流

只有在已经明确知道结构和目标，并且需要做“带字段的手工维护”时，才考虑在查询流程里顺手编辑记录。

## Skill Promotion Candidate

当你想看哪些 recurring pattern 已经适合升级成 project-local skill 时，优先检查：

- `docs/memory/feedback/prevents-recurrence.md`
- `docs/feedback/feedback-collection.md`

重点关注以下字段：

```markdown
### Skill Promotion Candidate
- source_record:
- recurring_pattern:
- candidate_skill_name:
- recommended_scope:
- status:
```

如果候选项已经明确，下一步应交给 `/skill-creator`，而不是继续停留在反馈查询阶段。

## 文件位置

- 记忆入口：`docs/memory/index.md`
- 用户反馈：`docs/memory/feedback/user-feedback.md`
- Agent 反馈：`docs/memory/feedback/agent-feedback.md`
- 防止再犯：`docs/memory/feedback/prevents-recurrence.md`
- 处理规范：`docs/feedback/feedback-collection.md`
