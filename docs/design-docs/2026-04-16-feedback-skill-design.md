# Feedback Skill 设计文档

> **状态**：已实现
> **日期**：2026-04-16

## 目标

新增一个用户可直接调用的根 Skill：`/feedback`，把“提反馈”从“查反馈”中拆出来，让用户可以用自然语言提交意见，并稳定落到账户中的 feedback memory。

## 问题

仓库里已有 `feedback-query`，但它的命名和说明更像管理台，而不是用户入口：

- 用户想到的是“我要提 feedback”，不是“我要 query feedback”
- 现有记录方式偏手工，要求用户理解内部字段
- 导航文档没有一个显眼的反馈提交入口

这会让 feedback 能力存在于仓库中，却不容易被真正使用。

## 设计结论

### 结论 1：提交入口和查询入口要拆开

- `/feedback` 负责提交新的用户反馈
- `/feedback-query` 负责查历史、做 summary、看 recurrence

这样命名更贴近用户意图，也能减少 Skill 触发歧义。

### 结论 2：`/feedback` 应接受自然语言，而不是字段表单

用户只需要表达“哪里不对、希望怎么改、为什么在意”，Skill 负责把它整理成：

- `type`
- `content`
- `action`
- `applied`
- `prevents_recurrence`

用户无需先理解 memory 文件格式。

### 结论 3：反馈提交必须直接连到 memory 与执行

`/feedback` 不只是“帮忙写一条记录”，还要把反馈转成当前会话的执行输入：

- 记录到 `docs/memory/feedback/user-feedback.md`
- 当前任务立即按反馈调整
- 必要时再提名到 `prevents-recurrence`

## 范围

本次只覆盖用户反馈提交入口，不扩展到：

- Agent feedback 录入
- 自动化归档
- feedback 数据分析脚本

这些仍由现有流程和 `feedback-curator` 等角色承担。

## 信息架构

新增：

```text
skills/feedback/SKILL.md
.claude/skills/feedback/SKILL.md
```

调整：

```text
skills/feedback-query/SKILL.md
.claude/skills/feedback-query/SKILL.md
```

并同步更新导航、规格和 feedback 规则文档。
