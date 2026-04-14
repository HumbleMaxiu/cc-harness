---
name: feedback-query
description: 查询反馈历史、记录新反馈、查看防止再犯条目
---

# 反馈查询

查询和管理用户反馈、Agent 反馈及防止再犯记录。

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

## 记录新反馈

### 记录用户反馈
```
/feedback-query add-user
  - 类型：correction / preference / request / complaint
  - 内容：反馈内容
  - 行动：采取的行动
  - 是否防止再犯：true / false
```

### 记录 Agent 反馈
```
/feedback-query add-agent
  - 来源：reviewer / tester / self-check
  - 类型：correction / improvement / issue
  - 内容：反馈内容
  - 建议：建议的处理方式
```

## 文件位置

- 记忆入口：`docs/memory/index.md`
- 用户反馈：`docs/memory/feedback/user-feedback.md`
- Agent 反馈：`docs/memory/feedback/agent-feedback.md`
- 防止再犯：`docs/memory/feedback/prevents-recurrence.md`
- 处理规范：`docs/feedback/feedback-collection.md`
