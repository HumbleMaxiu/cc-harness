# cc-harness 架构文档

> 最后更新：2026-04-09
> 作者：Claude Code Harness Plugin

## 1. 系统概述

### 1.1 项目定位

cc-harness 是一个 Claude Code 插件，提供两套核心能力：

1. **Harness Engineering 初始化**：引导用户为任何项目配置 Harness Engineering 最佳实践（AGENTS.md + docs/）
2. **Skill 工程框架**：创建、评估、基准测试和渐进改进 Claude Code Skills 的完整工具链

### 1.2 关键指标

- 代码规模：Harness 核心约 500 行文档定义
- 交付形式：Claude Code Plugin（MCP v1 兼容）
- 用户类型：希望用 AI Agent 提升效率的开发团队

## 2. 架构图

```
用户
  │
  ├─ /初始化 Harness ──→ harness-init SKILL
  │                           │
  │                      生成 AGENTS.md
  │                      生成 docs/ 目录
  │                      生成 init.sh
  │
  ├─ /创建 AGENTS.md ──→ agents-md-guide SKILL
  │                           │
  │                      评估项目状态
  │                      生成 AGENTS.md
  │                      维护更新
  │
  ├─ /创建 Skill ──→ skill-creator SKILL
  │                    │
  │              SKILL.md 模板
  │              evals/ 测试用例
  │              评估脚本
  │
  └─ /exa-search ──→ exa-search SKILL
                         │
                    Exa MCP Server
                    网络/代码搜索
```

## 3. 核心模块

| 模块 | 路径 | 职责 | 依赖关系 |
|------|------|------|----------|
| **Harness 初始化** | `.claude/skills/harness-init/` | 编排完整项目初始化流程 | agents-md-guide |
| **AGENTS.md 管理** | `.claude/skills/agents-md-guide/` | 生成和改进 AGENTS.md | 无 |
| **Skill 创建** | `.claude/skills/skill-creator/` | 创建、评估、基准测试 Skills | agents-md-guide |
| **Exa 搜索** | `.claude/skills/exa-search/` | 通过 Exa MCP 进行网络和代码搜索 | 无 |
| **docs 生成** | `.claude/skills/docs-generator/` | 生成 docs/ 目录结构 | harness-init |

## 4. 边界与约束

### 4.1 架构原则

1. **渐进披露**：AGENTS.md 是入口索引，docs/ 是详细内容，任何超过 300 行的文档都应拆分
2. **双重目录同步**：`skills/` 是发布副本，`.claude/skills/` 是开发目录，禁止直接在 `skills/` 开发
3. **Skill 自包含**：每个 Skill 是独立的功能单元，有自己的 SKILL.md、references/、evals/
4. **为删除而构建**：每个约束编码一个"模型无法独自完成"的假设，随模型能力提升而失效

### 4.2 禁止模式

- ❌ 禁止在 `skills/` 目录直接开发（必须通过 `.claude/skills/` 中转）
- ❌ 禁止创建缺少 YAML frontmatter 的 SKILL.md
- ❌ 禁止提交未通过 evals/ 测试的 Skill
- ❌ 禁止在文档地图中引用 `.claude/` 等内部开发路径

## 5. 外部依赖

| 依赖 | 用途 | 来源 |
|------|------|------|
| Claude Code | 宿主环境 | Anthropic |
| Exa MCP Server | 搜索能力 | exa.ai |
| Python 3 | Skill 评估脚本 | 系统环境 |
| Claude API | Skill 评估调用 | Anthropic |

## 6. 生命周期流程

### 6.1 新建 Skill 流程

```
用户需求 → skill-creator → SKILL.md 模板
                            ↓
                    创建 .claude/skills/<name>/
                            ↓
                    生成 evals/evals.json
                            ↓
                    运行评估 → 迭代改进
                            ↓
                    同步到 skills/<name>/
                            ↓
                    发布到 marketplace.json
```

### 6.2 Harness 初始化流程

```
用户触发 → harness-init 编排
                ↓
        评估项目状态
                ↓
        agents-md-guide 生成 AGENTS.md
                ↓
        docs-generator 生成 docs/
                ↓
        可选：init.sh 环境脚本
                ↓
        Git 提交
```
