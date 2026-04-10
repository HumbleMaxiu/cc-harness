---
name: docs-generator
description: "为项目生成完整的 docs/ 目录结构。按项目复杂度生成：简单项目生成 architecture.md；中等项目生成 architecture + conventions + testing；复杂项目额外生成 api.md、data-model.md、deployment.md 和 decisions/ ADR。本 Skill 读取 harness-init/references/02-docs-structure.md 获取完整模板，覆盖 OpenAI Codex docs/ 结构最佳实践（Harness Engineering 渐进披露原则）。触发场景：'生成 docs/'、'创建文档结构'、'补充架构文档'、harness-init 初始化流程第 4 步。"
---

# docs-generator：docs/ 目录生成

本 Skill 根据项目复杂度生成符合 Harness Engineering 原则的 `docs/` 目录。

**核心原则：**
- **渐进披露**：AGENTS.md = 入口索引，docs/ = 详细内容
- **按需生成**：从简单开始，复杂度逐步增加
- **与 harness-init 协同**：作为 harness-init 第 4 步的文档生成引擎

**与其他 Skill 的关系：**
- **harness-init**：编排者，调用本 Skill 生成文档
- **agents-md-guide**：AGENTS.md 文档地图自动指向本 Skill 生成的 docs/

---

## 触发场景

| 用户说… | 行动 |
|--------|------|
| "生成 docs/" | 生成完整 docs/ 目录结构 |
| "创建文档结构" | 评估复杂度，生成对应文档 |
| "补充架构文档" | 评估现有 docs/，补充缺失内容 |
| "初始化 Harness"（harness-init 第 4 步）| 自动调用，生成 docs/ |

---

## 工作流

### 步骤 1：评估项目复杂度

读取 `harness-init/references/02-docs-structure.md` 了解三个复杂度级别：

| 级别 | 特征 | 生成文档 |
|------|------|----------|
| **简单** | Solo，<5 人，单一技术栈 | `docs/architecture.md` |
| **中等** | 5-20 人，多模块，需要协调 | `architecture.md` + `conventions.md` + `testing.md` |
| **复杂** | 20+ 人，多团队，微服务 | + `api.md` + `data-model.md` + `deployment.md` + `decisions/` |

评估信号：
- 项目是否有多个子目录/包？
- 是否有 API 接口定义？
- 是否有数据库 schema？
- 是否有多个部署环境？

### 步骤 2：读取项目上下文

必须读取：
1. `AGENTS.md` — 了解已定义的项目概述和技术栈
2. `package.json` / `go.mod` / `Cargo.toml` — 了解技术栈和依赖
3. 现有 `docs/` 内容（如已存在）— 避免重复生成

可选读取：
- `README.md` — 提取项目概述
- `src/` 结构 — 验证架构描述
- 现有配置文件 — 提取编码规范

### 步骤 3：生成文档

读取 `references/` 获取模板：

| 文档 | 模板来源 |
|------|----------|
| `docs/architecture.md` | `references/architecture-template.md` |
| `docs/conventions.md` | `references/conventions-template.md` |
| `docs/testing.md` | `references/testing-template.md` |
| `docs/api.md` | `references/api-template.md` |
| `docs/data-model.md` | `references/data-model-template.md` |
| `docs/deployment.md` | `references/deployment-template.md` |
| `docs/decisions/` | `references/adr-template.md` |

### 步骤 4：更新 AGENTS.md 文档地图

生成文档后，更新 `AGENTS.md` 中的文档地图：

```markdown
## Documentation Map

| Topic | File |
|-------|------|
| Architecture | `docs/architecture.md` |
| Coding Conventions | `docs/conventions.md` |
| Testing Guide | `docs/testing.md` |
| API Reference | `docs/api.md` |
| Data Model | `docs/data-model.md` |
| Deployment | `docs/deployment.md` |
| Decisions | `docs/decisions/` |
```

---

## OpenAI Codex docs/ 结构最佳实践

基于 OpenAI Harness Engineering 实验的文档结构：

```
AGENTS.md              ← ~100 行，入口索引
ARCHITECTURE.md        ← 架构总览
docs/
├── design-docs/          # 设计文档
│   ├── index.md
│   └── core-beliefs.md   # 核心设计原则
├── exec-plans/            # 执行计划
│   ├── active/           # 当前进行中的计划
│   ├── completed/        # 已完成的计划
│   └── tech-debt-tracker.md
├── product-specs/         # 产品规格
│   ├── index.md
│   └── new-user-onboarding.md
├── references/            # 参考文档
│   └── design-system-reference-llms.txt
├── DESIGN.md               # 设计原则
└── GOVERNANCE.md           # 治理规范
```

**适用于复杂项目（20+ 人团队）。**

---

## 输出确认

生成后向用户确认：

```
✅ docs/ 目录生成完成

## 已创建文件
- docs/architecture.md     # 系统架构
- docs/conventions.md     # 编码规范
- docs/testing.md         # 测试策略

## 已更新
- AGENTS.md 文档地图 ✓

## 下一步
- 补充 docs/ 文件中的具体内容
- 确认文档地图路径正确
- 在每次重大架构变更后更新 docs/
```

---

## 参考文档

| 文件 | 用途 |
|------|------|
| `harness-init/references/02-docs-structure.md` | 三个复杂度级别的完整模板 |
| `references/architecture-template.md` | architecture.md 模板 |
| `references/conventions-template.md` | conventions.md 模板 |
| `references/testing-template.md` | testing.md 模板 |
| `references/api-template.md` | api.md 模板 |
| `references/data-model-template.md` | data-model.md 模板 |
| `references/deployment-template.md` | deployment.md 模板 |
| `references/adr-template.md` | ADR（架构决策记录）模板 |
