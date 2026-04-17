# cc-harness

Claude Code 插件，帮助用户在项目中生成 harness 约束下的 AI 协作环境。提供预设的 skills、agents、MCPs、workflows、hooks，实现 harness engineering 最佳实践。

## 文档导航

| 类别 | 路径 | 内容 |
|------|------|------|
| 设计理念 | [docs/DESIGN.md](docs/DESIGN.md) | 系统设计原则和目标 |
| 方法论 | [docs/HARNESS_METHODOLOGY.md](docs/HARNESS_METHODOLOGY.md) | harness engineering 最佳实践与演进方法 |
| 路线图 | [docs/PLANS.md](docs/PLANS.md) | 执行阶段和产品路线图 |
| 产品感觉 | [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | 产品为谁服务、什么是"好" |
| 质量评分 | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | 质量维度的记分卡 |
| 可靠性 | [docs/RELIABILITY.md](docs/RELIABILITY.md) | 超时、重试、幂等性、observability |
| 安全 | [docs/SECURITY.md](docs/SECURITY.md) | Secrets、auth、audit 预期 |
| 项目总览 | [docs/guides/project-overview.md](docs/guides/project-overview.md) | 项目介绍、结构图、流程图和后续方向 |
| 用户指南 | [docs/guides/harness-guide.md](docs/guides/harness-guide.md) | 用户如何开始、升级和维护 harness |
| Memory | [docs/memory/index.md](docs/memory/index.md) | 项目记忆与反馈索引 |
| 反馈 | [docs/feedback/feedback-collection.md](docs/feedback/feedback-collection.md) | 反馈收集和处理规范 |
| 执行计划 | [docs/exec-plans/](docs/exec-plans/index.md) | 主动执行中的计划 |
| 产品规格 | [docs/product-specs/](docs/product-specs/index.md) | 各领域产品规格文档 |

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js |
| Agent 定义 | Claude Code Agent definitions (Markdown) |
| 工作流编排 | Claude Code Skills (Markdown) |
| 会话钩子 | Node.js hooks |

## 命令快速参考

```bash
# 无本地安装命令，通过 Claude Code 加载 skills 运行
# 查看所有可用 skills
ls skills/

# Agent 定义
ls .claude/agents/
```

## Skill 快速参考

| Skill | 用途 |
|-------|------|
| `/brainstorming` | 创造性工作前的协作式需求和设计探索 |
| `/writing-plans` | 多步骤任务规格和需求（先于实现） |
| `/dev-workflow` | A/Dev/R/T 四角色开发流程（Skill/Subagent/Team 模式） |
| `/doc-sync` | 基于代码和流程变更同步相关文档、索引和导航 |
| `/plan-persist` | 为当前 active plan 和 Run Trace 提供轻量持续化与恢复锚点 |
| `/harness-help` | 命令索引、根入口和常见场景快速参考 |
| `/harness-audit` | 检查当前项目的 harness 健康度和关键缺口 |
| `/harness-guide` | 根据场景推荐应该进入哪个 skill / workflow |
| `/harness-quality-gate` | 交付、提交或阶段收尾前的质量门禁 |
| `/feedback` | 用自然语言提交用户反馈，并自动落到 feedback memory |
| `/feedback-query` | 查询 feedback 历史、summary 和 recurrence 记录 |
| `/skill-creator` | 创建、编辑和改进 AgentSkills |
| `/harness-setup` | 为项目搭建或更新 agent harness |
| `/exa-search` | 网络、代码和公司研究（神经搜索） |

## Harness 命令

| 命令 | 描述 |
|------|------|
| `harness help` | 查看根入口、场景推荐和命令索引 |
| `harness audit` | 检查当前项目的 harness 健康状态 |
| `harness guide` | 根据当前任务推荐 skill / workflow |
| `harness quality gate` | 运行交付前质量门禁 |

## Agent 团队

| 角色 | 定义文件 | 职责 |
|------|----------|------|
| Architect | [docs/design-docs/architect.md](docs/design-docs/architect.md) | 任务开始前检查计划，开发完成后维护文档 |
| Challenger | [docs/design-docs/challenger.md](docs/design-docs/challenger.md) | 对计划、claim、API 假设和完成声明做对抗式验证 |
| Developer | [docs/design-docs/developer.md](docs/design-docs/developer.md) | TDD 实现功能 |
| Reviewer | [docs/design-docs/reviewer.md](docs/design-docs/reviewer.md) | 代码质量和安全审查 |
| Tester | [docs/design-docs/tester.md](docs/design-docs/tester.md) | 探测验证入口并执行测试验证 |
| Feedback Curator | [docs/design-docs/feedback-curator.md](docs/design-docs/feedback-curator.md) | 整理 Agent 反馈、维护 feedback memory、输出自动处理轨迹与最终汇总摘要 |

## 行为规则

### 必须 (MUST)
- MUST 在编码前先头脑风暴 — 创造性工作（HARD-GATE：设计批准前禁止写实现代码）
- MUST 写测试再实现 (TDD)
- MUST NOT eval()/exec() 处理用户输入 — CWE-95
- MUST NOT shell=True 传用户参数 — CWE-78
- MUST NOT f-string/format SQL 拼接 — CWE-89
- MUST NOT 提交 .env / *.key / *.pem — CWE-798
- MUST NOT 留死代码 / 调试输出
- MUST NOT 未经验证就声称完成

### 反馈规则

- **用户反馈**：优先级最高。记录到 `docs/memory/feedback/user-feedback.md`，立即执行，无需询问
- **Agent 反馈**：来自 Reviewer/Tester 或自检的问题。先记录到 `docs/memory/feedback/agent-feedback.md`；阻塞型反馈优先自动修复并继续主流程，非阻塞建议在最终交付前统一汇总给用户确认
- **防止再犯**：同一问题出现 2 次或以上 → 将预防措施写入 `AGENTS.md` 或相关规范
- 新会话或 `/compact` 后恢复上下文时，先读 `docs/memory/index.md`，再按需查看 `docs/memory/feedback/`

### Claude Code 运行模式

- 想要尽量减少 Claude Code 运行时的危险模式确认，项目或全局设置中加入 `"skipDangerousModePermissionPrompt": true`
- 这个设置只影响 Claude Code 自身的危险模式确认；真正的“中途不停下来问用户”还需要 `dev-workflow` 和 agent 契约采用最终统一确认模式

### 文档同步（编辑源码后自检）

- 编辑源码后检查：对应的 docs/ 模块文档是否存在？
  - 如果存在且变更影响其内容 → 立即更新
  - 如果不确定 → 在 exec-plan 中注明

## How to use this harness

| 场景 | 从这里开始 | 然后 |
| ---- | ---------- | ---- |
| 新功能 | `docs/product-specs/<domain>.md` | 在 `docs/exec-plans/active/` 创建计划 → 实现 → 移动到 `completed/` |
| Bug 修复 | `docs/RELIABILITY.md` + `docs/SECURITY.md` | 修复 → 更新 `docs/QUALITY_SCORE.md` |
| 架构变更 | `ARCHITECTURE.md` | 添加 `docs/design-docs/<name>.md` → 从 index 链接 → 实现 |
| 不知道从哪开始 | `harness help` | 再根据场景进入 `harness guide` 或具体 skill |
| 想看当前 harness 健康度 | `harness audit` | 优先修高风险缺口，再回到主 workflow |

Tech debt、文档维护和其他工作流请参阅 [docs/PLANS.md](docs/PLANS.md)。
