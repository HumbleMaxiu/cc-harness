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
| plan-persist | 轻量 planning 持续化与恢复锚点 |
| harness-help | 根入口索引与场景快速参考 |
| harness-audit | harness 健康检查 |
| harness-guide | 按场景推荐 skill / workflow |
| harness-quality-gate | 交付前质量门禁 |
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

### Harness Root Entry Skills

`cc-harness` 应提供一组产品级根入口，让用户先按意图找到正确 workflow，而不是要求用户先理解全部内部 skill：

1. `/harness-help`：显示命令索引、根入口和高频场景
2. `/harness-audit`：读取质量与结构信号，输出健康检查
3. `/harness-guide`：根据任务场景推荐 skill / workflow
4. `/harness-quality-gate`：在交付或提交前运行质量门禁

这四个 Skill 的目标不是替代具体 workflow，而是让用户更容易发现和进入已有能力。

### `/plan-persist` Skill

用户运行 `/plan-persist` 时，应围绕现有 `docs/exec-plans/active/`、`Run Trace` 和 `Skill Workflow Record` 提供轻量状态持续化，而不是新建第二套 planning 文件体系。

### Memory-driven Skill Promotion

当 feedback 或 recurrence 中出现稳定、重复、可复用的 workflow 时，系统应允许通过 `Skill Promotion Candidate` 把记忆层问题升级为 project-local skill。

推荐分工：

1. `/feedback-query`：查看 candidate
2. `/skill-creator`：将 candidate 落成真正的 skill

## 相关文档

- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
- `.claude-plugin/marketplace.json`
