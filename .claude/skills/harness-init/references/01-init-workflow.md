# Harness 初始化详细流程

从用户请求到完整 Harness 设置的逐步指南。

---

## 决策流程图

```
用户请求初始化
│
├── "完整初始化"（推荐）
│   ├── 步骤 1：评估项目
│   ├── 步骤 2：需求澄清
│   ├── 步骤 3：生成 AGENTS.md
│   ├── 步骤 4：创建 docs/ 结构
│   ├── 步骤 5：init.sh（按需）
│   └── 步骤 6：Git 提交
│
├── "仅 AGENTS.md"
│   ├── 步骤 1：评估项目
│   ├── 步骤 2：需求澄清
│   └── 步骤 3：生成 AGENTS.md
│
└── "改进现有"
    └── 委托 agents-md-guide 工作流 C
```

---

## 步骤 1：评估项目

### 读取项目信息

```bash
# 查找根目录配置文件
ls -la *.json *.toml *.yaml *.yml *.toml Makefile 2>/dev/null | head -20

# 查看现有文档
ls -la docs/ README* 2>/dev/null

# 查看源码结构
ls -la src/ lib/ packages/ apps/ 2>/dev/null
```

### 判断标准

| 条件 | 初始化类型 |
|------|------------|
| 根目录无 AGENTS.md | 完整初始化 |
| 有 AGENTS.md 但 >300 行 | 委托 agents-md-guide 工作流 B（拆分） |
| 有 AGENTS.md 但过时/缺失章节 | 委托 agents-md-guide 工作流 C（改进） |
| 用户明确说"只创建 AGENTS.md" | 仅 AGENTS.md |

---

## 步骤 2：需求澄清模板

如果用户需求模糊，使用以下问题：

```
项目信息收集：

1. 项目类型
   - Web 应用 / API 服务 / CLI 工具 / SDK / 脚本

2. 技术栈（示例）
   - 前端：React / Vue / Svelte
   - 后端：Node.js / Go / Python / Rust
   - 数据库：PostgreSQL / MongoDB / Redis
   - 构建：Vite / Webpack / Cargo

3. 团队规模
   - Solo / 小团队（2-5人）/ 中团队（5-20人）/ 大团队（20+人）

4. Agent 主要用途
   - 编码开发 / Code Review / 文档生成 / 全流程

5. 特殊约束（可选）
   - 必须使用的技术？
   - 必须避免的技术？
   - 特殊的安全/合规要求？
```

---

## 步骤 3：生成 AGENTS.md

### 输入清单

```markdown
## AGENTS.md 生成输入

### 来自项目的信息
- 项目名称：[从 package.json / README 推断]
- 技术栈：[从配置文件推断]
- 目录结构：[从 ls 结果推断]

### 来自用户的信息
- 项目类型：
- 团队规模：
- Agent 用途：
- 特殊约束：

### 需要从用户确认的关键约定
1. [约定 1 — 用户必须确认]
2. [约定 2 — 用户必须确认]
```

### 输出结构

生成的 AGENTS.md 必须包含：

| 章节 | 必填 | 说明 |
|------|------|------|
| 项目概述 | ✅ | 1-2 句话 |
| 快速开始 | ✅ | 3 条核心命令 |
| 目录结构 | ✅ | 关键目录 + 一句话 |
| 关键约定 | ✅ | 5-10 条具体规则 |
| 文档地图 | ✅ | 指向 docs/ 文件 |
| **中文约束** | ✅ | 强制 |
| 技术栈 | ○ | 按需 |
| 常见任务 | ○ | 按需 |

---

## 步骤 4：创建 docs/ 结构

### 评估复杂度

```bash
# 统计文件数量
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" | wc -l

# 统计目录层级
find . -type d -maxdepth 3 | wc -l
```

| 指标 | 简单项目 | 中等项目 | 复杂项目 |
|------|----------|----------|----------|
| 源文件数 | <50 | 50-500 | 500+ |
| 目录层级 | 2-3 | 3-4 | 4+ |
| docs/ 文件数 | 1-2 | 3-5 | 6+ |

---

## 步骤 5：init.sh 创建标准

### 何时需要

| 场景 | 是否需要 |
|------|----------|
| 需要安装依赖（npm install / pip install） | ✅ |
| 需要复制环境配置文件 | ✅ |
| 需要运行数据库迁移 | ✅ |
| 纯静态项目（开箱即用） | ❌ |

### init.sh 模板

```bash
#!/bin/bash
# init.sh — Agent 工作前运行
set -e

echo "=== Harness 初始化 ==="

# 依赖安装
echo "[1/3] 安装依赖..."
npm install

# 环境配置
echo "[2/3] 配置环境..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "  已创建 .env.local，请填写实际值"
fi

# 验证
echo "[3/3] 验证环境..."
npm run typecheck
npm test -- --run

echo ""
echo "=== Harness ready ==="
echo "运行 'npm run dev' 开始开发"
```

---

## 步骤 6：Git 提交

### 提交信息格式

```
harness: initial project setup

- 添加 AGENTS.md（AI Agent 入口）
- 添加 docs/ 目录结构
- 添加 init.sh（如有）
```

### 验证提交

```bash
git log --oneline -3
# 应显示 "harness: initial project setup"
```
