# Product Spec — Skill System

> **Domain：** skill-system

## 目标

提供一套 Skill 创作和发布工具，让开发者能够创建符合 cc-harness 规范的 Claude Code Skills，并在 marketplace 中分发。

## 用户可见行为

### `/skill-creator` Skill

用户运行 `/skill-creator` 创建新 Skill，引导式完成：

1. 定义 Skill 名称和描述
2. 编写 SKILL.md 主文件
3. 可选：添加 references/ 和 scripts/
4. 发布到 `.claude-plugin/marketplace.json`

### Skill 结构规范

```
skills/<skill-name>/
├── SKILL.md          # 必需：入口文档
├── references/       # 可选：LLM context stubs
├── scripts/          # 可选：Node.js 辅助脚本
└── README.md         # 可选（skill 文件夹内除 SKILL.md 外不额外添加）
```

### SKILL.md 格式

```yaml
---
name: <skill-name>
description: <一句话描述>
---

# <Skill 名称>

[详细文档]
```

## 已内置 Skills

| Skill | 描述 |
|-------|------|
| brainstorming | 创造性需求和设计探索 |
| dev-workflow | A/Dev/R/T 角色开发流程 |
| feedback | 用户反馈提交入口 |
| feedback-query | feedback 历史查询与摘要 |
| harness-setup | Harness 脚手架生成与更新 |
| skill-creator | Skill 创作工具 |
| writing-plans | 多步骤计划编写 |
| exa-search | 神经搜索 |
| using-brainstorming | brainstorming 前置引导 |

### `/feedback` Skill

用户运行 `/feedback` 时，应允许直接使用自然语言表达纠正、偏好、请求或投诉，并由 Skill：

1. 将反馈分类为 `correction` / `preference` / `request` / `complaint`
2. 生成 `user-feedback.md` 所需的结构化记录
3. 立即推动当前任务按该反馈执行
4. 在需要时提示是否应升级为 `prevents-recurrence`

## 相关文档

- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
- `.claude-plugin/marketplace.json`
