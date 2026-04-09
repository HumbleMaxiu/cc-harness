---
name: agents-md-guide
description: "为任何项目生成、审查和改进 AGENTS.md 文件。本 Skill 是 Harness 初始化流程的核心组件，由 harness-init skill 调用，或在以下结构性变更时自动触发：创建了新的子目录且满足 AGENTS.md 条件（5+ 文件、独立职责边界）、docs/ 目录结构发生变化、现有 AGENTS.md 超过 300 行或内容过时、用户反馈 Agent 输出质量下降（此时应检查 AGENTS.md 是否需要改进）。基于 Harness Engineering 框架：AGENTS.md 是目录索引而非百科全书、编码模型无法自行推断的假设、为删除而构建。根目录 AGENTS.md 必须约束 AI Agent 使用中文输出。"
---

# AGENTS.md 生成与改进指南

本 Skill 定义了 AGENTS.md 文件的生成和渐进改进逻辑，供 harness-init skill 调用。

**核心原则（Harness Engineering）：**
- **AGENTS.md = 目录索引，而非百科全书**：告诉 Agent 信息在哪里，而非它需要知道的一切
- **从简单开始，按需增加复杂度**：每个组件编码一个"模型无法独自完成"的假设
- **为删除而构建**：假设会随模型能力提升而失效
- **中文输出**：根目录 AGENTS.md 必须强制 AI Agent 使用中文输出

---

## 自动触发场景

本 Skill 在以下情况下**自动触发**（无需用户显式请求）：

| 触发条件 | 行动 |
|----------|------|
| 创建了新子目录且满足 AGENTS.md 条件 | → 评估是否创建子目录 AGENTS.md |
| docs/ 目录结构发生变化 | → 审查是否需要更新文档地图 |
| 现有 AGENTS.md 超过 300 行 | → 触发拆分流程 |
| 现有 AGENTS.md 超过 6 个月未更新 | → 触发时效性检查 |
| 用户反馈 Agent 表现下降 | → 检查 AGENTS.md 是否为根因 |

> ⚠️ 在执行任何工作流之前，先读取 `references/05-auto-assessment.md`，理解完整的触发条件与决策逻辑。

**满足创建子目录 AGENTS.md 的条件（需同时满足）：**
1. 子模块有独立职责和边界
2. 子模块有特有的代码约定（3+ 条）
3. 子模块有 5+ 个独特文件
4. 子模块可能独立被 Agent 处理

---

## 工作流

### 工作流 A：评估新子目录

当检测到新子目录时：

> **读取 `references/02-generation-workflow.md`** — 了解从需求到生成的完整流程框架。
> **读取 `references/05-auto-assessment.md`** — 评估子目录是否满足创建条件时，参照决策树执行。

1. **评估是否需要 AGENTS.md**
   - 读取 `references/03-subdir-management.md` 的条件清单
   - 如不满足条件：不创建，记录判断理由

2. **满足条件时创建**
   - 读取 `references/03-subdir-management.md` 的子目录模板
   - 创建子目录 AGENTS.md（≤ 100 行）
   - **不重复**根目录已有的约定

3. **更新根目录索引**
   - 读取根目录 AGENTS.md
   - 在文档地图或子模块章节添加条目
   - 格式：`[子模块名]: [相对路径]/AGENTS.md — [一句话描述]`

### 工作流 B：AGENTS.md 过长时拆分

当根目录 AGENTS.md 超过 300 行时：

> **读取 `references/05-auto-assessment.md`** — 参照"条件 3：AGENTS.md 长度超标"的决策树执行。

1. **识别可拆分的章节**
   - 详细约定 → `docs/conventions.md`
   - 测试规范 → `docs/testing.md`
   - 部署流程 → `docs/deployment.md`

2. **执行拆分**
   - 读取 `references/01-agents-template.md` 的质量标准
   - 创建 docs/ 文件并迁移内容
   - AGENTS.md 保留路由指向

3. **验证结果**
   - AGENTS.md 行数 ≤ 200
   - 路由完整，无信息丢失

### 工作流 C：现有 AGENTS.md 改进

当检测到现有 AGENTS.md 需要改进时：

> **读取 `references/02-generation-workflow.md`** — 参照"改进流程"章节执行，确保改进过程符合生成标准。

1. **评估现有状态**
   - 对照 `references/04-progressive-improvement.md` 的评分矩阵
   - 识别 Top 3 问题

2. **按优先级修复**
   - P0（必须）：缺失中文约束、包含过时错误信息
   - P1（建议）：过长、缺少文档地图
   - P2（可选）：缺少验证日期

3. **执行改进**
   - 一次改进一个层级
   - 向用户确认后再写入

---

## AGENTS.md 质量标准

| 维度 | 标准 |
|------|------|
| **行数** | 50–200 行（超过 300 行需拆分）|
| **结构** | 必须包含：项目概述、快速开始、目录结构、关键约定、文档地图 |
| **语言** | 根目录 AGENTS.md 强制中文输出约束 |
| **风格** | 命令式规则，而非模糊描述 |
| **时效性** | 包含最后验证日期 |

---

## 参考文档

| 文件 | 用途 |
|------|------|
| `references/01-agents-template.md` | 标准 AGENTS.md 模板 + 质量检查清单 |
| `references/02-generation-workflow.md` | 从需求到 AGENTS.md 的详细生成流程 |
| `references/03-subdir-management.md` | 子目录 AGENTS.md 管理与索引更新 |
| `references/04-progressive-improvement.md` | 渐进式改进现有 AGENTS.md + 评分矩阵 |
| `references/05-auto-assessment.md` | 自动评估触发条件与决策逻辑 |
