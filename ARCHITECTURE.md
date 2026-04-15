# Architecture — cc-harness

> 顶层技术地图，对人类和 agents 均适用。

## 组件概览

```
cc-harness/
├── skills/               # Skill 定义 — Claude Code 技能入口
│   ├── brainstorming/     # 创造性需求探索
│   ├── dev-workflow/      # A/Dev/R/T 角色开发流程
│   ├── harness-setup/     # Harness 脚手架生成
│   ├── skill-creator/     # Skill 创作工具
│   ├── using-brainstorming/
│   ├── writing-plans/     # 多步骤计划
│   └── exa-search/        # 神经搜索
│
├── .claude/
│   ├── agents/            # Agent 定义（完整能力描述）
│   │   ├── architect.md
│   │   ├── developer.md
│   │   ├── reviewer.md
│   │   └── tester.md
│   ├── hooks/             # Session 钩子（Node.js）
│   │   └── session-start-bootstrap.js
│   └── settings.json      # Claude Code 配置
│
├── docs/                  # Harness 文档（见 AGENTS.md 导航）
│   ├── design-docs/        # 架构设计文档
│   ├── exec-plans/         # 执行计划（active / completed）
│   ├── product-specs/      # 各领域产品规格
│   └── generated/          # 生成产物占位符
│
├── .claude-plugin/         # Claude Code 插件清单与 marketplace 元数据
│   ├── plugin.json
│   └── marketplace.json
└── orchestrate.md          # 编排命令（Legacy shim）
```

## 技术边界

```
用户会话层（Claude Code CLI）
    ├── Skills — 工作流编排（Markdown 文档）
    ├── Agents — 角色定义（Markdown + YAML front matter）
    ├── Hooks — Session 生命周期（Node.js）
    ├── Plugin Manifest — git marketplace 安装入口
    └── docs/ — 文档系统（Markdown + Git 版本化）
              ├── design-docs/   — 设计决策
              ├── exec-plans/    — 执行计划
              ├── product-specs/ — 产品规格
              └── references/    — LLM context stubs
```

## 无传统服务端

cc-harness 是一个 **Node.js CLI 工具包**，没有后端服务、API 服务器或数据库。运行态完全在 Claude Code 的会话中。

## 相关文档

- 系统设计目标：[docs/DESIGN.md](docs/DESIGN.md)
- 安全约定：[docs/SECURITY.md](docs/SECURITY.md)
- 设计文档索引：[docs/design-docs/index.md](docs/design-docs/index.md)
- 产品规格索引：[docs/product-specs/index.md](docs/product-specs/index.md)
