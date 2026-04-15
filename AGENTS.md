# cc-harness

Claude Code 插件，帮助用户在项目中生成 harness 约束下的 AI 协作环境。提供预设的 skills、agents、MCPs、workflows、hooks，实现 harness engineering 最佳实践。

## 文档导航

| 类别 | 路径 | 内容 |
|------|------|------|
| 设计理念 | [docs/DESIGN.md](docs/DESIGN.md) | 系统设计原则和目标 |
| 路线图 | [docs/PLANS.md](docs/PLANS.md) | 执行阶段和产品路线图 |
| 产品感觉 | [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | 产品为谁服务、什么是"好" |
| 质量评分 | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | 质量维度的记分卡 |
| 可靠性 | [docs/RELIABILITY.md](docs/RELIABILITY.md) | 超时、重试、幂等性、observability |
| 安全 | [docs/SECURITY.md](docs/SECURITY.md) | Secrets、auth、audit 预期 |
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
| `/skill-creator` | 创建、编辑和改进 AgentSkills |
| `/harness-setup` | 为项目搭建或更新 agent harness |
| `/exa-search` | 网络、代码和公司研究（神经搜索） |

## Agent 团队

| 角色 | 定义文件 | 职责 |
|------|----------|------|
| Architect | [docs/design-docs/architect.md](docs/design-docs/architect.md) | 任务开始前检查计划，开发完成后维护文档 |
| Developer | [docs/design-docs/developer.md](docs/design-docs/developer.md) | TDD 实现功能 |
| Reviewer | [docs/design-docs/reviewer.md](docs/design-docs/reviewer.md) | 代码质量和安全审查 |
| Tester | [docs/design-docs/tester.md](docs/design-docs/tester.md) | 测试验证和 lint 检查 |

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
- **Agent 反馈**：来自 Reviewer/Tester 或自检的问题。先记录到 `docs/memory/feedback/agent-feedback.md`；阻塞型反馈（`REJECTED`）立即询问用户，非阻塞建议在任务收尾统一询问用户，**未经确认不得执行**
- **防止再犯**：同一问题出现 2 次或以上 → 将预防措施写入 `AGENTS.md` 或相关规范
- 新会话或 `/compact` 后恢复上下文时，先读 `docs/memory/index.md`，再按需查看 `docs/memory/feedback/`

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

Tech debt、文档维护和其他工作流请参阅 [docs/PLANS.md](docs/PLANS.md)。
