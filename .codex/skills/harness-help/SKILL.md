---
name: harness-help
description: 显示 cc-harness 的命令索引、根 Skill 入口、常见场景的推荐起点；当用户说“harness help”“有哪些入口”“怎么开始”“有哪些命令/skills”时使用。
---

# Harness Help

显示 `cc-harness` 的命令索引、根入口、常见场景和推荐起点，帮助用户快速知道“下一步该用哪个 skill / workflow”。

## 何时使用

- 用户说“harness help”
- 用户问“这个 harness 怎么用”
- 用户想看有哪些根入口、skills、workflow
- 用户不知道从哪里开始

## 何时不要使用

- 用户已经明确指定要执行某个具体 skill
- 用户想做项目健康检查，改用 `/harness-audit`
- 用户想获得按场景推荐的入口，改用 `/harness-guide`
- 用户要执行交付前检查，改用 `/harness-quality-gate`

## 最小执行流程

1. 读取 `AGENTS.md`，获取项目导航与 Skill 快速参考
2. 读取 `docs/guides/harness-guide.md`，获取场景化使用方式
3. 扫描 `skills/` 和 `.claude/agents/`，确认当前仓库内可用入口
4. 用“根入口 + 高频场景”的结构输出帮助信息

## 输出格式

```markdown
### Harness Help
- root_entries:
- common_scenarios:
- recommended_start:
- related_docs:
```

保持简洁，优先告诉用户“从哪里开始”。
