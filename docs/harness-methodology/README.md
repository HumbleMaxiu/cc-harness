# Harness Engineering 方法论

> 本目录汇集 OpenAI、Anthropic、Stripe、Martin Fowler 等机构的 Harness Engineering 调研成果，为 cc-harness 插件提供理论支撑和最佳实践参考。
>
> 最后更新：2026-04-10

---

## 目录结构

```
harness-methodology/
├── README.md                        # 本文件，方法论总览
├── core-concepts/
│   ├── what-is-harness.md          # Harness Engineering 定义与核心概念
│   ├── three-pillars.md            # 三大支柱：Context、Constraints、Entropy
│   ├── cybernetic-model.md         # 控制论模型：Feedforward vs Feedback
│   └── agent-lifecycle.md          # Agent 生命周期管理
├── workflow-patterns/
│   ├── seven-stages.md             # 七阶段工作流（MEV 模式）
│   ├── plan-execute-test-fix.md    # 六阶段开发流程
│   ├── four-stages-intake.md       # Intake → Triage → Action → Audit
│   └── hierarchical-delegation.md   # 层级委托模式
├── verification/
│   ├── verification-loops.md       # 验证循环：核心高 ROI 模式
│   ├── three-layer-testing.md       # AI Agent 三层测试
│   ├── human-in-the-loop.md        # 人工介入模式
│   └── pre-completion-checklist.md # 预完成清单
└── session-management/
    ├── session-protocol.md         # 会话协议：Orient → Act → Verify
    ├── context-engineering.md      # 上下文工程
    └── checkpoint-resume.md         # 检查点与恢复
```

---

## 快速导航

### 新手入门
1. [什么是 Harness Engineering](core-concepts/what-is-harness.md) — 基础概念
2. [三大支柱](core-concepts/three-pillars.md) — 理解 Harness 的核心维度
3. [七阶段工作流](workflow-patterns/seven-stages.md) — 业界标准流程

### 实践指南
4. [验证循环](verification/verification-loops.md) — 最高 ROI 的可靠性改进
5. [三层测试](verification/three-layer-testing.md) — AI Agent 特有的测试策略
6. [会话协议](session-management/session-protocol.md) — 每次会话的标准流程

### 进阶主题
7. [控制论模型](core-concepts/cybernetic-model.md) — Feedforward 与 Feedback 的对比
8. [层级委托](workflow-patterns/hierarchical-delegation.md) — 多 Agent 编排
9. [检查点恢复](session-management/checkpoint-resume.md) — 长时任务状态管理

---

## 外部参考来源

| 来源 | 关键贡献 |
|------|----------|
| [OpenAI Codex Harness Engineering](https://gist.github.com/celesteanders/21edad2367c8ede2ff092bd87e56a26f) | OpenAI 1M LOC 实验，三支柱框架，渐进披露原则 |
| [Anthropic: Effective Harnesses for Long-Running Agents](https://docs.anthropic.com/en/docs/build-agentics) | 上下文工程，验证循环，持久化状态 |
| [Martin Fowler: Harness Engineering](https://martinfowler.com/articles/harness-engineering.html) | 三类调节：Maintainability、Architecture Fitness、Behaviour |
| [Harness Engineering Academy](https://harnessengineering.academy) | 工具调用可靠性，生产级 Agent 架构 |
| [AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/) | Legibility、Mechanical Enforcement、Entropy Management |
| [MEV: Agentic Workflows](https://mev.com/blog/agentic-workflows-stages-roles-validators-approvals) | 七阶段模型，Execute Proposes / Commit Writes 原则 |
| [Conzit: Agentic Workflow Design](https://conzit.com/post/redefining-ai-workflow-design-addressing-agentic-challenges) | 失败模式分析，核心循环，补充命令 |
| [Douglas Liles: Plan-Execute-Test-Fix](https://medium.com/@dougliles/ai-agent-workflow-orchestration-d49715b8b5e3) | 六阶段流程，子 Agent 架构，评价管道 |
| [Skywork AI: Multi-Step Agent Tasks](https://skywork.ai/blog/ai-agent/how-ai-agents-complete-multi-step-tasks-step-by-step/) | 规划与执行分离，验证循环，自反思机制 |
| [The Ai Consultancy: Intake Workflow](https://medium.com/@ai_93276/a-practical-agent-build-intake-triage-action-audit-trail-4c5ea7ba6c2d) | 四阶段框架，Intake 作为入口 |

---

## 核心原则速查

| # | 原则 | 来源 |
|---|------|------|
| 1 | 上下文窗口是约束；结构化产物是解决方案 | Anthropic |
| 2 | 生成与评价分离；Agent 无法客观评判自己的输出 | OpenAI |
| 3 | 一次会话一个任务；聚焦防止上下文耗尽 | Anthropic |
| 4 | 验证先行；基线检查后再构建 | OpenAI |
| 5 | 验证循环是最高 ROI 的可靠性改进 | Harness Engineering Academy |
| 6 | Repository 是单一事实来源；不在 Repo 中就不存在 | OpenAI |
| 7 | 人工掌舵，Agent 执行；工程师设计环境，非 Agent | OpenAI |
| 8 | Agent 优化任务完成，而非任务正确性；需要预完成清单拦截 | AgentPatterns.ai |
| 9 | 渐进披露；AGENTS.md 是索引，docs/ 是详细内容 | OpenAI Codex |
| 10 | 为删除而构建；每个约束编码一个模型无法独自完成的假设 | AgentPatterns.ai |

---

## 与 cc-harness 的映射

| 方法论概念 | cc-harness 实现 |
|------------|-----------------|
| 七阶段 / Intake | `harness-init` Skill 编排流程 |
| 验证循环 | `skill-creator` evals/ 测试框架 |
| 三层测试 | `docs-generator` 模板中的 L1/L2/L3 测试规范 |
| 渐进披露 | `AGENTS.md` + `docs/` 双重文档结构 |
| 双重目录同步 | `.claude/skills/`（开发）↔ `skills/`（发布） |
| SKILL.md frontmatter | Agent 的类型契约（Schema 验证） |
| 预完成清单 | 各 Skill 的"输出确认"章节 |

[最后验证：2026-04-10]
