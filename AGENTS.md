# cc-harness

`cc-harness` 是一个文档优先的 harness 系统。仓库事实源是 `skills/`、`scripts/hooks/`、`docs/` 和安装脚本；宿主运行目录由安装脚本生成，不在仓库中保存。

## 项目目标

- skills、hooks、commands、rules 都围绕文档工作
- 它们要么读取文档、写入文档、完善文档，要么把流程结果收口到文档
- 每一类关键 docs 都应有明确读取入口、维护入口和使用场景

## 导航

| 区域 | 路径 |
|------|------|
| 架构 | [ARCHITECTURE.md](ARCHITECTURE.md) |
| 方法论 | [docs/HARNESS_METHODOLOGY.md](docs/HARNESS_METHODOLOGY.md) |
| 可靠性 | [docs/RELIABILITY.md](docs/RELIABILITY.md) |
| 安全 | [docs/SECURITY.md](docs/SECURITY.md) |
| 项目总览 | [docs/guides/project-overview.md](docs/guides/project-overview.md) |
| Harness 指南 | [docs/guides/harness-guide.md](docs/guides/harness-guide.md) |
| AI 安装指南 | [docs/install-ai.md](docs/install-ai.md) |
| Memory | [docs/memory/index.md](docs/memory/index.md) |
| Feedback | [docs/feedback/feedback-collection.md](docs/feedback/feedback-collection.md) |
| Product Specs | [docs/product-specs/](docs/product-specs/index.md) |
| Skill Standard | [docs/references/skill-standard.md](docs/references/skill-standard.md) |
| Review Packs | [docs/references/review-pack-registry.md](docs/references/review-pack-registry.md) |

## Source 布局

| 路径 | 用途 |
|------|------|
| [skills/](skills/) | 公开 workflow skills 和 role skills |
| [scripts/hooks/](scripts/hooks/) | 共享 hook runtime scripts |
| [scripts/checks/](scripts/checks/) | 仓库检查脚本，例如 Skill Standard check |
| [install.sh](install.sh) | Host installer wrapper |
| [scripts/install.mjs](scripts/install.mjs) | Claude Code / Codex installer implementation |

仓库不得重新引入已提交的 `.claude/`、`.codex/`、`.claude-plugin/`、`examples/`、`fixtures/` 或 `agents/` 目录。

## Skill 快速参考

| Skill | 用途 |
|-------|------|
| `/brainstorming` | 创造性工作前的需求和设计探索 |
| `/writing-plans` | 多步骤任务规格和计划 |
| `/plan-review` | 实现前的只读计划审核 gate，由 `/pm-orchestrator` 按风险调度 |
| `/pm-orchestrator` | PM 总控层，负责阶段控制、skill 分配、失败回流、并行/串行策略和交付 gate 编排 |
| `/tdd` | RED/GREEN/REFACTOR 纪律，供 `/developer` 在行为变更中调用 |
| `/follow-goal` | 长跑任务的 durable objective、停止条件和 checkpoint 执行协议 |
| `/doc-sync` | 文档影响分析、同步和索引维护 |
| `/plan-persist` | active plan / Run Trace 的轻量持续化 |
| `/harness-setup` | 为项目搭建或更新 harness 文档骨架 |
| `/harness-help` | 命令索引和常见场景入口 |
| `/harness-guide` | 根据场景推荐 workflow |
| `/harness-audit` | 检查 harness 健康度 |
| `/harness-quality-gate` | 交付前质量门禁 |
| `/ci-cd-gate` | GitHub Actions PR checks / CI 日志读取、失败分类、交付阻断判断和 PM 回流建议 |
| `/feedback` | 分诊并提交长期用户反馈 |
| `/feedback-query` | 查询 feedback 历史和 recurrence |
| `/skill-creator` | 创建、编辑和审计 Skill |
| `/skill-audit` | 按 Skill Standard 审计 Skill，供用户和 PM gate 调度 |

## Role Skills

| Role Skill | 用途 |
|------------|------|
| `/architect` | 计划检查、docs impact 判断、文档同步 gatekeeping |
| `/challenger` | 对计划、claim、API 假设和完成声明做对抗式验证 |
| `/developer` | PM 调度下的轻量实现者，负责单 slice 实现、技术栈识别和 TDD 证据输出 |
| `/reviewer` | 代码质量和安全审查 |
| `/review-security` | 安全专项审查 pack，按 high-confidence data-flow 模式审查 auth、secrets、injection、tenant boundary 和 dependency risk |
| `/review-github-actions` | GitHub Actions 专项审查 pack，覆盖 workflow 安全和 AI agent action 风险 |
| `/review-frontend` | 前端专项审查 pack，覆盖 UI 状态、a11y、responsive、forms 和 interaction risk |
| `/review-performance` | 性能专项审查 pack，覆盖 hot path、queries、cache、bundle、large lists 和 expensive render/computation |
| `/tester` | 探测验证入口并执行测试验证 |
| `/feedback-curator` | 整理 feedback、维护 memory、输出处理摘要 |

## 规则

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

### Skill Standard

- 创建、修改、审计或引入三方 skill 时，读取 `docs/references/skill-standard.md`
- 从 feedback / recurrence 生成 skill 前，先抽象 pressure scenario
- 三方来源 skill 必须包含 `references/source.md`
- 手动检查入口：`node scripts/checks/skill-standard.mjs`
- 用户或 PM gate 需要结构化审计结果时，使用 `/skill-audit`
