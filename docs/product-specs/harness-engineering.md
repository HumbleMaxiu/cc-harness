# Product Spec — Harness Engineering

> **Domain：** harness-engineering

## 目标

提供一套标准化的 harness 脚手架生成工具，让任何项目能够快速搭建符合 OpenAI harness engineering 原则的 agent 协作环境。

## 用户可见行为

### `/harness-setup` Skill

用户运行 `/harness-setup` 后，经过少量问答（项目名称、架构类型、domains、agent 平台），生成：

- `AGENTS.md` — agent 操作入口和文档索引
- `ARCHITECTURE.md` — 项目技术架构图
- `docs/` 目录树 — 含 design-docs/、exec-plans/、product-specs/、generated/、references/
- Agent platform bridge 文件（按需）

### 交互流程

1. 自动检测项目 baseline（greenfield vs existing）
2. 收集上下文：名称、目的、架构类型、domains、agent 平台
3. 汇总确认（硬性门槛：确认前不创建文件）
4. 创建目录结构
5. 填充文件
6. 审查检查点
7. 验证交叉链接
8. 生成 platform bridges

## CLI/API 接触点

| 接触点 | 描述 |
|--------|------|
| `/harness-setup` | Claude Code skill 入口 |
| `/harness-setup update` | 增量更新现有 harness |

## Edge Cases

- **已有 harness**：提示用户选择 re-scaffold（覆盖）或 update（增量修改）
- **缺失关键目录**：只创建缺失的目录，不删除用户文件
- **无 package.json**：检测 Node.js 以外的项目时，调整 stack 推断

## 相关文档

- [docs/PLANS.md](../PLANS.md)
- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
- skill-creator SKILL：`skills/skill-creator/SKILL.md`
