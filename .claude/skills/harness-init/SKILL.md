---
name: harness-init
description: "为项目初始化 Harness Engineering 环境。当用户说'初始化 Harness'、'创建 AGENTS.md'、'设置 AI Agent 环境'、'让我更好地使用 AI Agent'、或'为这个项目配置 AI' 时触发。本 Skill 编排完整的 Harness 初始化流程：生成根目录 AGENTS.md、创建 docs/ 目录结构、设置初始化脚本。核心生成逻辑委托给 agents-md-guide skill（读取模板、生成文件）。后续维护中的 AGENTS.md 变更（如子目录创建、文档更新）由 agents-md-guide 自动处理。"
---

# Harness Engineering 初始化

本 Skill 是 Harness Engineering 的初始化入口，负责编排完整的项目设置流程。

**与其他 Skill 的关系：**
- **agents-md-guide**：本 Skill 的核心组件，负责 AGENTS.md 的生成逻辑
- 本 Skill 专注于"编排"，agents-md-guide 专注于"执行"

**核心原则：**
- **从简单开始**：先有 AGENTS.md，后续按需补充 docs/
- **渐进披露**：AGENTS.md = 目录索引，详细信息放 docs/
- **为删除而构建**：每个约束编码一个"模型无法独自完成"的假设

---

## 触发场景

| 用户说… | 行动 |
|--------|------|
| "初始化 Harness" | → 完整初始化流程（AGENTS.md + docs/ + init.sh） |
| "创建 AGENTS.md" | → 仅生成 AGENTS.md（按需创建 docs/） |
| "设置 AI Agent 环境" | → 完整初始化流程 |
| "为这个项目配置 AI" | → 完整初始化流程 |
| "让我更好地使用 AI Agent" | → 评估现有状态，补充完善 |

---

## 完整初始化流程

### 步骤 1：评估项目状态

```
检查项目根目录：
├── 已有 AGENTS.md？→ 评估是否需要改进（→ agents-md-guide 工作流 C）
├── 有 docs/ 目录？→ 记录现有文档
└── 空项目？→ 进入完整初始化
```

### 步骤 2：需求澄清（如需要）

如用户需求模糊，澄清：

| 问题 | 作用 |
|------|------|
| 项目类型？ | Web / CLI / SDK / 脚本 |
| 技术栈？ | 确定语言特定约定 |
| 团队规模？ | 决定约定数量 |
| Agent 主要用途？ | 编码 / Review / 文档 |

### 步骤 3：生成 AGENTS.md

调用 `agents-md-guide` 的生成逻辑：

1. 读取 `agents-md-guide/references/01-agents-template.md` 获取模板
2. 读取 `agents-md-guide/references/02-generation-workflow.md` 了解流程
3. 生成 AGENTS.md（50–200 行）
4. **强制包含中文输出约束**

### 步骤 4：创建 docs/ 目录结构

按项目复杂度决定是否需要 `docs/`：

**简单项目（Solo，<5 人）**：
```
docs/
├── architecture.md      # 系统设计
└── conventions.md      # 编码规范（按需）
```

**中等项目（5-20 人）**：
```
docs/
├── architecture.md      # 系统设计
├── conventions.md       # 编码规范
├── api.md              # API 约定
└── testing.md          # 测试策略
```

**复杂项目（20+ 人，多团队）**：
```
docs/
├── architecture.md      # 系统设计
├── conventions.md       # 编码规范
├── api.md              # API 约定
├── data-model.md       # 数据模型
├── testing.md          # 测试策略
├── deployment.md       # 部署流程
└── decisions/          # ADR（Architecture Decision Records）
    └── 001-chose-x.md
```

详细模板见 `references/02-docs-structure.md`

### 步骤 5：环境初始化（如需要）

如项目需要环境准备，创建 `init.sh`：

```bash
#!/bin/bash
# init.sh — Agent 工作前运行
set -e

# 安装依赖
npm install

# 复制环境配置
cp .env.example .env.local

# 验证环境
npm run typecheck
npm test -- --run

echo "Harness ready for agent work"
```

### 步骤 6：Git 提交

```bash
git add -A && git commit -m "harness: initial project setup"
```

---

## 输出确认

初始化完成后，向用户确认：

```
✅ Harness 初始化完成

## 已创建文件
- AGENTS.md               # 根目录入口
- docs/architecture.md     # 系统设计
- docs/conventions.md     # 编码规范

## 下一步
- 检查 AGENTS.md 内容是否准确
- 根据需要补充 docs/ 详细内容
- 运行 init.sh（如有）

## 后续维护
- 新增子模块时，agents-md-guide 会自动评估是否需要子目录 AGENTS.md
- docs/ 结构变化时会自动更新文档地图
```

---

## 参考文档

| 文件 | 用途 |
|------|------|
| `references/01-init-workflow.md` | 详细初始化步骤与决策 |
| `references/02-docs-structure.md` | docs/ 目录结构模板 |

**agents-md-guide 参考（核心生成逻辑）：**

| 文件 | 用途 |
|------|------|
| `../agents-md-guide/references/01-agents-template.md` | AGENTS.md 模板 |
| `../agents-md-guide/references/02-generation-workflow.md` | 生成流程 |
| `../agents-md-guide/references/03-subdir-management.md` | 子目录管理 |
| `../agents-md-guide/references/04-progressive-improvement.md` | 改进指南 |
