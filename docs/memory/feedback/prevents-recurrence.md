# 防止再犯记录

> 记录重复出现的问题模式及其预防措施，确保反馈会升级为系统约束。这里记录的是抽象后的规则，不是某个具体 lint 错误或一次性的命令输出。

## 规范

### 记录格式

每条记录包含：
- **问题类型** (problem type)
- **问题模式** (pattern)
- **问题描述** (description)
- **预防措施** (prevention — 写入 AGENTS.md 或相关规范)
- **首次出现** (first occurrence date)
- **出现次数** (occurrence count)
- **已同步位置** (synced locations)
- **提名状态** (nomination status — `candidate` / `promoted`)

### 抽象要求

- 记录“为什么这类问题会反复出现”和“以后应该遵守什么规则”
- 不记录“第 37 行有一个 lint 报错”这类一次性细节
- 原始证据应留在交接文档、review findings 或测试结果中
- 只有能归纳成跨任务复用规则的问题，才应该升级到这里

### 更新时机

当同一类型的问题出现 **2 次或以上** 时，将预防措施写入：
1. `AGENTS.md` 的行为规则
2. 相关 Agent 的定义文件
3. 或相关专题规范文档

在达到正式升级门槛前，`feedback-curator` 可以先以 `candidate` 状态记录提名，等待主 agent 与用户确认后再升级为正式规范变更。

### Skill Promotion Candidate（可选）

当某条 recurrence 已不只是“写规则避免再犯”，而是足以沉淀成稳定 workflow 时，可追加：

```markdown
### Skill Promotion Candidate
- source_record:
- recurring_pattern:
- candidate_skill_name:
- recommended_scope:
- status: proposed / accepted / created / rejected
```

这类候选项后续应转交 `/skill-creator`，而不是只停留在 recurrence 记录里。

## 已记录的防止再犯条目

| ID | 问题类型 | 描述 | 预防措施 | 次数 | 提名状态 | 已同步位置 |
|----|---------|------|---------|------|---------|-----------|
| `pr-20260416-001` | `mirror-sync-overwrite` | 当 `.claude/`、`skills/`、`.codex/` 出现内容漂移时，agent 为了修复 consistency check 直接运行 `sync:mirrors`，会把“声明上的事实源”覆盖到其他目录，进而抹掉只存在于镜像侧、但其实更新的用户修改。 | 运行任何 mirror sync 前，必须先检查三侧 diff 并明确“最新事实来源”来自哪一侧；若存在用户手工改动或无法确定来源，禁止直接 sync，改为手动合并或先向用户确认；不得把“让检查通过”当作 sync 的充分理由。 | `1` | `candidate` | `docs/memory/feedback/user-feedback.md` |
| <!-- 按需追加 --> | | | | | | |
