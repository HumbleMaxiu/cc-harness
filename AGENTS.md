# cc-harness

> Claude Code 开发辅助工具集，为项目配置 Harness Engineering 最佳实践（AGENTS.md + docs/），并提供 Skill 创建、评估和改进的完整工程框架。

## Quick Start

```bash
# 查看可用 skills
ls .claude/skills/

# 初始化新项目 Harness
/初始化 Harness

# 创建新 Skill
/创建 Skill

# 生成 AGENTS.md
/创建 AGENTS.md
```

## 项目概述

cc-harness 是一个 Claude Code Plugin（MCP v1 兼容），包含两套核心能力：

1. **Harness Engineering 初始化**：`harness-init` Skill 引导用户为任何项目配置 AGENTS.md + docs/ 最佳实践
2. **Skill 工程框架**：`skill-creator` Skill 提供创建、评估、基准测试 Claude Code Skills 的完整工具链

**项目类型**：Plugin / Workflow 工具集（无运行时代码，纯文档和模板定义）

## Tech Stack

- **Plugin 格式**：MCP v1，`marketplace.json` 声明
- **Skill 开发目录**：`.claude/skills/`（开发用）
- **Skill 发布目录**：`skills/`（发布副本，与 `.claude/skills/` 同步）
- **文档**：`docs/`，符合 OpenAI Codex docs/ 结构
- **评估脚本**：Python 3（用于 Skill evals）

## Directory Structure

```
cc-harness/
├── marketplace.json          # Plugin 元数据声明
├── .mcp.json                 # MCP Servers 配置
├── docs/                     # 项目文档（含 Harness Engineering 方法论）
│   ├── architecture.md       # 系统架构文档
│   ├── conventions.md         # 编码规范
│   ├── testing.md             # 测试策略
│   └── harness-methodology/   # Harness Engineering 方法论调研
│       ├── README.md              # 方法论总览
│       ├── core-concepts/         # 核心概念
│       ├── workflow-patterns/      # 工作流模式
│       ├── verification/           # 验证机制
│       └── session-management/     # 会话管理
├── agents/                   # Agent 定义（9 个）
│   ├── spec.md              # 需求分析
│   ├── planner.md           # 实施计划
│   ├── tdd-guide.md         # TDD 指南
│   ├── develop.md           # 增量实现
│   ├── code-reviewer.md     # 代码审查
│   ├── test-agent.md        # 测试执行
│   ├── lint-agent.md        # 代码检查
│   ├── fix-agent.md         # Bug 修复
│   └── architect.md         # 架构设计
├── commands/                 # CLI Commands
│   ├── feature-flow.md      # 完整功能开发流程
│   ├── prp-pr.md            # PR 自动化创建
│   └── orchestrate.md        # 多 Agent 编排
├── skills/                   # 发布版本 Skills（自动生成）
└── .claude/
    └── skills/               # Skills 开发目录
        ├── harness-init/     # 初始化编排 Skill
        ├── agents-md-guide/  # AGENTS.md 生成与管理
        ├── skill-creator/    # Skill 创建与评估
        ├── docs-generator/   # docs/ 目录生成
        └── exa-search/       # Exa 神经搜索
```

## Key Conventions

> ⚠️ 以下规则是硬约束，模型无法自行推断。Convention 来源：用户提供 > 从代码推断。

1. **双重目录同步**：`skills/` 是发布副本，`.claude/skills/` 是开发目录。禁止直接在 `skills/` 开发，必须通过 `.claude/skills/` 中转后同步
2. **SKILL.md 必须有 YAML frontmatter**：每个 Skill 的 SKILL.md 第一行必须是 `---` 开始的 YAML block，包含 `name` 和 `description` 字段
3. **禁止提交未通过 evals 的 Skill**：新增或修改的 Skill 必须通过 `skills/<name>/evals/evals.json` 中的测试用例
4. **禁止在文档地图中引用内部路径**：AGENTS.md 文档地图只包含用户面向的文档（如 `docs/*.md`），禁止引用 `.claude/`、`skill-creator/references/` 等内部开发路径
5. **Skill 自包含原则**：每个 Skill 是独立功能单元，有自己的 SKILL.md、references/、evals/，禁止跨 Skill 硬依赖
6. **为删除而构建**：每个约束编码一个"模型无法独自完成"的假设，随模型能力提升而失效

## Documentation Map

| Topic | File |
|-------|------|
| Architecture | `docs/architecture.md` |
| Coding Conventions | `docs/conventions.md` |
| Testing Strategy | `docs/testing.md` |
| Harness Methodology | `docs/harness-methodology/README.md` |

## 外部参考

> 本项目的设计和实现基于以下权威来源的 Harness Engineering 调研：

| 来源 | 关键贡献 | 链接 |
|------|---------|------|
| **OpenAI Codex** | 1M LOC 实验、三支柱框架、渐进披露 | [Gist](https://gist.github.com/celesteanders/21edad2367c8ede2ff092bd87e56a26f) |
| **Anthropic** | 上下文工程、验证循环、持久化状态 | [Docs](https://docs.anthropic.com/en/docs/build-agentics) |
| **Martin Fowler** | 三类调节：Maintainability、Architecture Fitness、Behaviour | [Article](https://martinfowler.com/articles/harness-engineering.html) |
| **AgentPatterns.ai** | Legibility、Mechanical Enforcement、Entropy Management | [Training](https://agentpatterns.ai/training/foundations/harness-engineering/) |
| **MEV** | 七阶段工作流、Execute proposes / Commit writes | [Blog](https://mev.com/blog/agentic-workflows-stages-roles-validators-approvals) |
| **Harness Engineering Academy** | 工具调用可靠性、生产级 Agent 架构 | [Academy](https://harnessengineering.academy) |
| **Conzit** | 失败模式分析、核心循环、补充命令 | [Article](https://conzit.com/post/redefining-ai-workflow-design-addressing-agentic-challenges) |
| **Douglas Liles** | 六阶段 Plan-Execute-Test-Fix、子 Agent 架构 | [Medium](https://medium.com/@dougliles/ai-agent-workflow-orchestration-d49715b8b5e3) |
| **The Ai Consultancy** | Intake → Triage → Action → Audit 四阶段框架 | [Medium](https://medium.com/@ai_93276/a-practical-agent-build-intake-triage-action-audit-trail-4c5ea7ba6c2d) |
| **Skywork AI** | 多步 Agent 任务、验证循环、自反思机制 | [Article](https://skywork.ai/blog/ai-agent/how-ai-agents-complete-multi-step-tasks-step-by-step/) |
| **how2** | 澄清检查、Agent 执行前需求验证 | [Guide](https://how2.sh/posts/how-to-add-a-clarification-step-to-agents/) |

## 方法论文档

`docs/harness-methodology/` 目录包含详细的调研总结：

```
harness-methodology/
├── README.md                    # 方法论总览
├── core-concepts/               # 核心概念
│   ├── what-is-harness.md      # Harness Engineering 定义
│   ├── three-pillars.md        # 三大支柱
│   ├── cybernetic-model.md     # 控制论模型
│   └── agent-lifecycle.md      # Agent 生命周期
├── workflow-patterns/           # 工作流模式
│   ├── seven-stages.md         # 七阶段（MEV）
│   └── plan-execute-test-fix.md # 六阶段开发流程
├── verification/                # 验证机制
│   ├── verification-loops.md   # 验证循环
│   ├── three-layer-testing.md   # 三层测试
│   ├── human-in-the-loop.md     # 人工介入
│   └── pre-completion-checklist.md # 预完成清单
└── session-management/          # 会话管理
    ├── session-protocol.md     # 会话协议
    └── context-engineering.md   # 上下文工程
```

## Language Constraint

**所有回复、注释、提交信息均使用中文。** 技术术语保留原始语言（Agent、Skill、Command、MCP、workflow 等）。

[最后验证：2026-04-10]
