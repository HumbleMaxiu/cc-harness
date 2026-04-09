# AGENTS.md 生成详细流程

从用户需求到完整 AGENTS.md 的逐步生成流程。

## Phase 1：需求澄清

如果用户提供了模糊需求，先澄清：

### 必问问题

| 问题 | 作用 |
|------|------|
| 项目类型是什么？ | 决定模板变体（Web/CLI/SDK/脚本） |
| 核心技术栈？ | 确定语言特定约定 |
| 有现有代码吗？ | 区分"全新项目"和"已有项目" |
| 团队规模？ | 决定约定数量和复杂度 |
| Agent 主要用途？ | 编码 / Review / 文档 / 全流程 |

### 需求类型判断

**模糊需求示例**：
- "帮我设置这个项目"
- "让它能用 AI Agent"
- "创建 AGENTS.md"

**清晰需求示例**：
- "为这个 React + Node.js 的电商后端创建 AGENTS.md"
- "为 `packages/auth` 子模块创建 AGENTS.md"

---

## Phase 2：信息收集

### 读取现有文件

如果项目已有代码，读取关键文件了解项目：

```
1. package.json / Cargo.toml / go.mod 等依赖文件
2. 根目录 README.md
3. src/ 目录结构
4. 现有配置文件 (.eslintrc, tsconfig.json 等)
```

### 构建信息清单

```
项目基本信息
├── 项目名称：
├── 项目类型：
├── 技术栈：
├── 团队规模：
└── Agent 用途：

关键约定（从代码推断）
├── 目录结构：
├── 命名规范：
├── 代码风格：
└── 测试方式：

缺失信息（需要用户补充）
├── [ ] 项目的核心约束？
├── [ ] 必须遵守的规范？
└── [ ] 特殊上下文？
```

---

## Phase 3：生成 AGENTS.md

### 步骤 1：选择模板

| 场景 | 模板选择 |
|------|----------|
| 全新空项目 | 使用 `01-agents-template.md` 基础模板 |
| 已有项目 | 基于模板 + 从代码推断内容 |
| 子目录模块 | 使用子目录模板 |
| 已有 AGENTS.md | 进入改进流程 |

### 步骤 2：填充内容

**必填章节**（根目录）：
1. 项目概述（1-2 句话）
2. 快速开始（3 条核心命令）
3. 目录结构（关键目录 + 一句话描述）
4. 关键约定（5-10 条具体规则）
5. 文档地图（指向 docs/ 文件）
6. **中文输出约束**（强制）

**可选章节**（按需添加）：
- 技术栈详情
- 代码风格
- 常见任务命令
- Submodules 索引

### 步骤 3：质量检查

对照清单自检：
- [ ] 行数 ≤ 200 行
- [ ] 必填章节完整
- [ ] 中文输出约束存在
- [ ] 无过时信息
- [ ] 无百科全书式内容

---

## Phase 4：用户确认

生成后向用户展示：

```
已生成 AGENTS.md，包含以下内容：

## 项目概述
[1-2 句话]

## 关键约定
1. [约定 1]
2. [约定 2]
...

## 文档地图
[表格]

请确认是否需要调整。如无异议，将写入 `AGENTS.md` 文件。
```

---

## 生成示例

### 输入
```
用户："为这个 TypeScript + React 项目创建 AGENTS.md"
```

### 读取项目后推断
- 项目类型：Web 应用
- 技术栈：TypeScript, React, Vite
- 测试：Vitest + React Testing Library
- Lint：ESLint + Prettier

### 输出

```markdown
# 我的项目

> React + TypeScript Web 应用

## 快速开始

```bash
npm install
npm run dev
npm test
```

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **测试**: Vitest + React Testing Library
- **代码检查**: ESLint + Prettier

## 目录结构

```
src/
├── components/    # 可复用 UI 组件
├── pages/         # 页面组件（路由级别）
├── hooks/         # 自定义 React Hooks
├── utils/         # 纯工具函数
└── __tests__/     # 集成测试
```

## 关键约定

1. **组件放在 `src/components/`**，页面组件放在 `src/pages/`
2. **每个组件必须有对应测试**，文件名 `ComponentName.test.tsx`
3. **使用 CSS Modules**，禁止全局 CSS（除 `index.css`）
4. **API 调用封装在 `src/api/`**，禁止在组件内直接 fetch

## 中文输出约束

**必须使用中文输出**。所有回复、注释、提交信息均使用中文。
```
