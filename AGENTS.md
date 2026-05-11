# cc-harness

`cc-harness` 是一个文档优先的 harness 系统。仓库事实源是 `skills/`、`scripts/hooks/`、`docs/` 和安装脚本；宿主运行目录由安装脚本生成，不在仓库中保存。

## Project Goal

- skills、hooks、commands、rules 都围绕文档工作
- 它们要么读取文档、写入文档、完善文档，要么把流程结果收口到文档
- 每一类关键 docs 都应有明确读取入口、维护入口和使用场景

## Navigation

| Area | Path |
|------|------|
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Methodology | [docs/HARNESS_METHODOLOGY.md](docs/HARNESS_METHODOLOGY.md) |
| Reliability | [docs/RELIABILITY.md](docs/RELIABILITY.md) |
| Security | [docs/SECURITY.md](docs/SECURITY.md) |
| Project Overview | [docs/guides/project-overview.md](docs/guides/project-overview.md) |
| Harness Guide | [docs/guides/harness-guide.md](docs/guides/harness-guide.md) |
| AI Install Guide | [docs/install-ai.md](docs/install-ai.md) |
| Memory | [docs/memory/index.md](docs/memory/index.md) |
| Feedback | [docs/feedback/feedback-collection.md](docs/feedback/feedback-collection.md) |
| Product Specs | [docs/product-specs/](docs/product-specs/index.md) |

## Source Layout

| Path | Purpose |
|------|---------|
| [skills/](skills/) | Public workflow skills and role skills |
| [scripts/hooks/](scripts/hooks/) | Shared hook runtime scripts |
| [install.sh](install.sh) | Host installer wrapper |
| [scripts/install.mjs](scripts/install.mjs) | Claude Code / Codex installer implementation |

The repository must not reintroduce checked-in `.claude/`, `.codex/`, `.claude-plugin/`, `examples/`, `fixtures/`, or `agents/` directories.

## Skill Quick Reference

| Skill | Purpose |
|-------|---------|
| `/brainstorming` | 创造性工作前的需求和设计探索 |
| `/writing-plans` | 多步骤任务规格和计划 |
| `/dev-workflow` | 角色 Skill 驱动的实现、审查、验证和文档同步闭环 |
| `/doc-sync` | 文档影响分析、同步和索引维护 |
| `/plan-persist` | active plan / Run Trace 的轻量持续化 |
| `/harness-setup` | 为项目搭建或更新 harness 文档骨架 |
| `/harness-help` | 命令索引和常见场景入口 |
| `/harness-guide` | 根据场景推荐 workflow |
| `/harness-audit` | 检查 harness 健康度 |
| `/harness-quality-gate` | 交付前质量门禁 |
| `/feedback` | 分诊并提交长期用户反馈 |
| `/feedback-query` | 查询 feedback 历史和 recurrence |
| `/skill-creator` | 创建、编辑和审计 Skill |

## Role Skills

| Role Skill | Purpose |
|------------|---------|
| `/architect` | 计划检查、docs impact 判断、文档同步 gatekeeping |
| `/challenger` | 对计划、claim、API 假设和完成声明做对抗式验证 |
| `/developer` | TDD 实现 |
| `/reviewer` | 代码质量和安全审查 |
| `/tester` | 探测验证入口并执行测试验证 |
| `/feedback-curator` | 整理 feedback、维护 memory、输出处理摘要 |

## Rules

### MUST

- MUST 在创造性编码前先头脑风暴，除非用户已经给出明确 specification
- MUST 写测试再实现，或记录明确 TDD 例外
- MUST NOT eval()/exec() 处理用户输入
- MUST NOT shell=True 传用户参数
- MUST NOT f-string/format SQL 拼接
- MUST NOT 提交 `.env` / `*.key` / `*.pem`
- MUST NOT 未经验证就声称完成

### Feedback

- 用户反馈只有在显式要求记录、评价 workflow/harness，或会约束未来类似任务时，才写入 `docs/memory/feedback/user-feedback.md`
- 当前任务的一次性实现说明、验收补充、测试同步和 session-only 指令留在任务上下文，不进入长期 memory
- Reviewer / Tester / self-check 反馈先进入 `docs/memory/feedback/agent-feedback.md`
- 同类问题出现 2 次或以上时，升级到 `docs/memory/feedback/prevents-recurrence.md` 或相关规范

### Docs Sync

- 编辑源码、hooks、installer、skills 或 workflow 后，检查相关 docs 是否需要同步
- 新增或删除 docs 后，更新对应 index
- 不确定的 docs impact 写入执行记录或最终风险说明
