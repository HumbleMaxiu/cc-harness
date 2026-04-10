# 什么是 Harness Engineering

> 来源：[OpenAI Codex Harness Engineering](https://gist.github.com/celesteanders/21edad2367c8ede2ff092bd87e56a26f)、[Harness Engineering Academy](https://harness-engineering.ai/blog/what-is-harness-engineering/)

---

## 定义

**Harness Engineering = Agent = Model + Harness 框架**

Harness Engineering 是设计、构建和运维 AI Agent 基础设施的工程学科。基础设施层负责约束、编排和验证 Model 的行为，确保 Agent 在生产环境中可靠运行。

> "The competitive advantage in AI products has shifted from model quality to harness quality. Teams see task completion rates of 60% vs 98% based entirely on harness quality." — Harness Engineering Academy

---

## 核心公式

```
Agent = Model + Harness
Harness = Context Engineering + Tool Orchestration + Verification + Error Handling + State Management + Observability
```

---

## 为什么需要 Harness

### 纯 Model 的问题

| 问题 | 表现 |
|------|------|
| 上下文耗尽 | 长任务中途丢失关键信息 |
| 过度自信 | 输出了 plausible 但错误的结果 |
| 任务发散 | 偏离原始目标，自信地走错方向 |
| 边界侵蚀 | 随时间推移，代码质量下降 |
| 上下文窗口是约束 | 一切存在的目的是弥合会话之间的差距 |

来源：[OpenAI Codex](https://gist.github.com/celesteanders/21edad2367c8ede2ff092bd87e56a26f)

---

## Model 与 Harness 的职责分工

| 职责 | Model | Harness |
|------|-------|---------|
| 推理 | ✓ | ✗ |
| 代码生成 | ✓ | ✗ |
| 工具调用 | ✓ | ✗ |
| 上下文管理 | ✗ | ✓ |
| 验证与安全 | ✗ | ✓ |
| 错误处理 | ✗ | ✓ |
| 成本控制 | ✗ | ✓ |
| 状态持久化 | ✗ | ✓ |

---

## Harness Engineering 的五大核心组件

### 1. Context Engineering（上下文工程）

决定模型在每个执行步骤中看到什么信息。

**挑战**：上下文窗口看起来很大（128K-200K tokens），但 Agent 执行 50 步后会耗尽。

**最佳实践**：
- Token 预算追踪：每次 LLM 调用前计算完整上下文预计 token 数；剩余 <20% 时触发摘要或截断
- 结构化上下文层级：任务规格和最近一次工具调用最重要，中间上下文可压缩
- 检查点恢复：任务太大无法在单次上下文窗口内完成时，设计紧凑摘要保存进度

### 2. Tool Orchestration（工具编排）

管理每个步骤中哪些工具可用及如何处理执行。

**最佳实践**：
- 严格 JSON Schema：工具接口定义必须包含名称、描述、参数约束
- Naive 工具集成（给 Agent 50 个工具让它选）注定失败
- 工具即契约：定义后不可随意变更，影响 Agent 推理

### 3. Verification & Safety（验证与安全）

在 Agent 输出到达真实世界前进行检查。

**最佳实践**：
- Schema 验证：输出是否符合预期结构？
- 语义验证：输出在给定输入和前序步骤下是否合理？
- 硬性限制：Agent 行为必须在预定义范围内

### 4. Human-in-the-Loop Controls（人工介入控制）

并非所有 Agent 行为都应自主执行。

**最佳实践**：
- 高风险操作（删除数据、发送外部通信、财务交易）必须有人类批准
- 设置批准门槛后，随团队对特定操作建立信心而逐步放宽
- 5 秒人工确认可防止 20 分钟调试会话

### 5. Lifecycle Management（生命周期管理）

覆盖 Agent 启动、健康监控、优雅关闭和崩溃恢复。

**最佳实践**：
- 健康检查：Agent 仍在进展还是陷入循环？
- 资源限制：每次任务最大 token 数
- 优雅关闭：任务状态持久化后可安全终止

---

## Harness Engineering vs Prompt Engineering vs Context Engineering

| 维度 | Prompt Engineering | Context Engineering | Harness Engineering |
|------|-------------------|-------------------|---------------------|
| **关注点** | 说什么 | 给什么信息 | 构建什么环境 |
| **变化频率** | 每次任务调整 | 每次会话变化 | 系统级设计 |
| **失败模式** | 模型不听指令 | 信息过多/过少 | 系统性崩溃 |
| **杠杆作用** | 单次输出优化 | 上下文质量 | 全局可靠性提升 |

---

## Harness Engineering 的演进阶段

```
阶段 0: 无 Harness（纯 Model）
    ↓
阶段 1: 基础 Harness（简单工具调用）
    ↓
阶段 2: 验证循环（Schema 验证 + 错误处理）
    ↓
阶段 3: 完整 Harness（上下文工程 + 生命周期管理）
    ↓
阶段 4: 生产级 Harness（可观测性 + 成本封顶 + 人工介入）
```

---

## OpenAI Codex 实验的启示

**实验规模**：3 名工程师，5 个月，100 万行代码，0 手动代码

**关键数据**：
- 初始人工率（Human Rate）：约 20%（每 5 行代码需 1 人审）
- 最终人工率：<5%（大部分靠 Agent 自评）

**三大支柱协同生效**：
- Legibility 告诉 Agent 该做什么
- Mechanical Enforcement 告诉 Agent 不能做什么
- Entropy Management 持续清理累积的混乱

---

## 为 cc-harness 插件的启示

| 原则 | 在 cc-harness 中的体现 |
|------|----------------------|
| 验证循环是最高 ROI | `skill-creator` 的 evals/ 测试框架 |
| Repository 是单一事实来源 | `.claude/skills/` 开发目录 |
| 一次会话一个任务 | 各 Skill 的触发短语设计 |
| 渐进披露 | `AGENTS.md`（索引）+ `docs/`（详细内容）|
| 人工掌舵，Agent 执行 | `harness-init` 编排流程 |
