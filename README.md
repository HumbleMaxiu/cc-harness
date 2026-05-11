# cc-harness

`cc-harness` 是一套文档优先的 AI 协作 harness。仓库本身只维护可复用的 `skills/`、`scripts/hooks/`、安装脚本和文档；Claude Code 与 Codex 所需的运行目录由安装脚本写入目标项目，不再作为仓库镜像保存。

## What Is Included

| Area | Path | Purpose |
|------|------|---------|
| Skills | [skills/](skills/) | 工作流入口、角色 Skill、harness 工具 Skill |
| Hooks | [scripts/hooks/](scripts/hooks/) | planning / memory / stop check 辅助 hook |
| Installer | [install.sh](install.sh), [scripts/install.mjs](scripts/install.mjs) | 将 skills 和 hooks 安装到 Claude Code 或 Codex 项目 |
| Docs | [docs/](docs/) | 方法论、规格、memory、反馈和使用指南 |

The repository intentionally does not keep checked-in `.claude/`, `.codex/`, `.claude-plugin/`, `examples/`, or `fixtures/` directories. Those are runtime/install outputs, not source-of-truth content.

## Install

For a local checkout:

```bash
./install.sh --target both --dest /path/to/project
```

Targets:

```bash
./install.sh --target claude-code --dest /path/to/project
./install.sh --target codex --dest /path/to/project
./install.sh --target both --dest /path/to/project
```

The installer copies `skills/` and `scripts/hooks/` into the target runtime directory and writes the hook config required by that host:

| Target | Generated Directory | Config |
|--------|---------------------|--------|
| Claude Code | `<project>/.claude/` | `.claude/settings.json` |
| Codex | `<project>/.codex/` | `.codex/config.toml`, `.codex/hooks.json` |

AI-facing install instructions are available at [docs/install-ai.md](docs/install-ai.md). You can give that file to another coding agent and ask it to install `cc-harness` into a target project.

## Core Skills

| Skill | Purpose |
|-------|---------|
| `/brainstorming` | 创造性工作前的需求和设计探索 |
| `/writing-plans` | 多步骤任务计划 |
| `/dev-workflow` | 角色 Skill 驱动的实现、审查、测试和文档同步闭环 |
| `/doc-sync` | 文档影响分析、同步和索引维护 |
| `/plan-persist` | active plan / Run Trace 的轻量持续化 |
| `/harness-setup` | 为项目生成或更新 harness 文档骨架 |
| `/harness-help` | 查看入口和命令索引 |
| `/harness-guide` | 按场景推荐 workflow |
| `/harness-audit` | 检查 harness 健康状态 |
| `/harness-quality-gate` | 交付前质量门禁 |
| `/feedback` | 分诊并记录长期用户反馈 |
| `/feedback-query` | 查询 feedback history 和 recurrence |
| `/skill-creator` | 创建、改进或审计 Skill |

## Role Skills

旧的独立角色定义已经转换为普通 Skill：

| Role Skill | Purpose |
|------------|---------|
| `/architect` | 计划检查、docs impact 判断、文档同步 gatekeeping |
| `/challenger` | 对计划、claim、API 假设和完成声明做对抗式验证 |
| `/developer` | 按计划和 TDD 约束执行实现 |
| `/reviewer` | 代码质量和安全审查 |
| `/tester` | 探测并执行测试、lint、typecheck、build 等验证 |
| `/feedback-curator` | 维护 agent/self-check feedback memory 与 recurrence |

`/dev-workflow` 通过这些角色 Skill 组织流程，不再依赖 host-specific role definition files。

## Typical Workflow

1. 新项目先运行 `/harness-setup` 生成文档骨架。
2. 新功能先进入 `/brainstorming`，再用 `/writing-plans` 写清范围和验收。
3. 实现阶段进入 `/dev-workflow`。
4. 文档受影响时运行 `/doc-sync`。
5. 交付前运行 `/harness-quality-gate`。
6. 可复用反馈通过 `/feedback` 沉淀到 memory。

## Development

This repository currently has no repo-local test script. For an install smoke check, run `./install.sh --target both --dest <target-project>` and inspect the generated Claude Code / Codex runtime files.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Project Overview](docs/guides/project-overview.md)
- [Harness Guide](docs/guides/harness-guide.md)
- [Install For AI Agents](docs/install-ai.md)
- [Role Skill Product Spec](docs/product-specs/agent-system.md)
