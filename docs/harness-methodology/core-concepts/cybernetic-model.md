# 控制论模型：Feedforward vs Feedback

> 来源：[Martin Fowler: Harness Engineering](https://martinfowler.com/articles/harness-engineering.html)、[AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/)

---

## 核心概念

Harness 就像一个**控制论调节器**（Cybernetic Governor），结合前馈（Feedforward）和反馈（Feedback）来调节代码库向期望状态演进。

```
期望状态（目标）
      ↑
      │ Feedback（反馈）
      │ 检测偏差并纠正
      │
Codebase ←────────→ Harness（Agent）
      ↑                   ↑
      │                   │
      │ Feedforward       │ Feedforward
      │（前馈）            │（前馈）
      │ 预测并预防         │ 引导行为
      │
      ↓
实际状态
```

---

## Feedforward（前馈）

**定义**：预测 Agent 行为并在行动前引导。

**目标**：在错误发生**之前**预防。

### Feedforward 的类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **Instructions** | Agent 解读的指导 | "使用 TypeScript strict mode" |
| **Skills** | 注入的领域知识 | "这个模块使用 Repository 模式" |
| **Architectural Constraints** | 禁止的架构模式 | "禁止前端直接访问数据库" |

### Feedforward 的问题

**Instructions 是概率性的**。在任务压力下（上下文填满、注意力分散），Agent 可能忽略指令。

```
问题场景：
1. Agent 被告知"不要使用 any 类型"
2. Agent 遇到复杂类型问题
3. Agent 选择用 any 快速解决
4. 构建通过（没有机械执行）
5. 错误被埋藏，直到运行时爆发
```

### Feedforward 的最佳实践

**1. 引导而非规定**
```
BAD: "禁止使用 goto 语句"
GOOD: "这个代码库使用函数式组合；如果需要提前退出，使用 early return"
```

**2. 提供上下文而非命令**
```
BAD: "创建 REST API"
GOOD: "这个项目使用 tRPC；所有 API 通过 src/api/ 目录下的 .ts 文件定义"
```

**3. 错误消息即引导**
```typescript
// 好的 Linter 错误消息
"Import order violation: third-party imports must come before src/ imports.
 Expected: 1) node_modules, 2) @/, 3) ./, 4) ../"
```

---

## Feedback（反馈）

**定义**：传感器检测输出，在错误发生后纠正。

**目标**：在错误传播之前捕获。

### Feedback 的类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **Computational** | CPU 执行，快速确定性 | 测试、Linter、类型检查 |
| **Inferential** | LLM 评估，推理性 | AI Judge、代码审查 Agent |

### Computational vs Inferential

| 维度 | Computational | Inferential |
|------|--------------|-------------|
| 速度 | 毫秒级 | 秒级 |
| 确定性 | 100% 确定性 | 概率性 |
| 成本 | 低 | 高 |
| 适用场景 | 结构检查 | 语义评估 |
| 维护 | 规则固定 | 随领域演进 |

### Feedback 的最佳实践

**1. 快速失败**
```
代码提交
    ↓
Linter 检查（<5s）→ 失败 → 立即修复
    ↓ 通过
测试运行（<30s）→ 失败 → 立即修复
    ↓ 通过
继续
```

**2. 分层反馈**
```
第 1 层：每次 commit → Lint + 类型检查（<1 分钟）
第 2 层：每次 PR → 单元测试 + 集成测试（<10 分钟）
第 3 层：持续监控 → 统计验证 + 漂移检测（后台运行）
```

**3. AI Judge 的正确使用**

AI Judge 适合：
- 代码风格一致性评估
- 文档完整性检查
- 安全模式识别

AI Judge 不适合（确定性检查）：
- 类型正确性 → 用 TypeScript
- 格式化规范 → 用 Prettier
- 测试覆盖 → 用覆盖率工具

---

## Feedforward 与 Feedback 的对比

| 维度 | Feedforward | Feedback |
|------|------------|----------|
| 时机 | 行动前 | 行动后 |
| 本质 | 预防性 | 检测性 |
| 优势 | 阻止错误发生 | 捕获意外错误 |
| 劣势 | 无法覆盖所有场景 | 错误已发生 |
| 成本 | 低（无额外计算） | 中到高（需要验证） |
| 延迟 | 无 | 有（验证需要时间） |

---

## 在变化生命周期中的分布

### 核心问题

反馈传感器（包括新的推理性传感器）应根据成本、速度和关键性分布在生命周期中。

```
时间 →
←──────────┬──────────┬──────────┬──────────┬──────────┐
           │          │          │          │          │
           ↓          ↓          ↓          ↓          ↓
        本地        Commit      CI         持续       定期
        开发        前          Pipeline   集成       监控
           │          │          │          │          │
           ▼          ▼          ▼          ▼          ▼
         Lint       测试       完整        发布       漂移
         快速       单元        测试套件    后监控     检测
         检查       测试        + AI Judge
           │
           ▼
      Agent 自评
      (推理性)
```

### Keep Quality Left（质量左移）

**原则**：越早发现问题，修复成本越低。

| 阶段 | 发现问题 | 修复成本 |
|------|----------|----------|
| 本地开发 | 1x | 最低 |
| Commit 前 | 5x | 低 |
| CI Pipeline | 20x | 中 |
| 生产环境 | 100x | 最高 |

---

## Martin Fowler 的三类调节

来源：[Martin Fowler: Harness Engineering](https://martinfowler.com/articles/harness-engineering.html)

### 1. Maintainability Harness（可维护性调节）

**目标**：保持代码可读、可测试、可维护。

**实现**：
```
Computational Sensors:
  - 类型检查（TypeScript strict）
  - Lint（ESLint rules）
  - 测试覆盖率（>80%）
  - 重复代码检测
  - 圈复杂度限制

Inferential Sensors:
  - AI 代码审查
  - 命名一致性检查
  - 文档完整性验证
```

### 2. Architecture Fitness Harness（架构适应性调节）

**目标**：确保架构特性符合预期。

**实现**：
```
Guides:
  - Skills 描述性能要求
  - 编码约定描述可观测性标准（logging 等）

Sensors:
  - 性能测试（响应时间 <500ms）
  - 架构检查工具（禁止循环依赖）
  - 依赖层级验证
```

### 3. Behaviour Harness（行为调节）

**目标**：确保 Agent 行为符合预期。

**实现**：
```
Guides:
  - SKILL.md 定义 Agent 角色
  - 触发短语定义输入契约

Sensors:
  - evals/ 测试验证输出
  - Schema 验证
  - 人工批准门控
```

---

## 对 cc-harness 的实践指导

### Feedforward 在 cc-harness 中的实现

```markdown
# SKILL.md 的引导作用
---
name: harness-init
description: "编排完整项目初始化流程"
triggers:
  - "初始化 Harness"
  - "创建 AGENTS.md"
---

→ Feedforward：告诉 Agent 这个 Skill 的职责范围
→ 引导 Agent 在正确场景下调用
```

### Feedback 在 cc-harness 中的实现

```yaml
# evals/evals.json
test_cases:
  - name: "SKILL.md 必须有 frontmatter"
    type: "computational"
    enforcement: "schema validation"
    expected: "pass"

  - name: "生成的文档符合模板"
    type: "inferential"
    enforcement: "AI Judge"
    criteria:
      - "包含必需章节"
      - "格式正确"
      - "内容相关"
```

### 调节类型分布

| 调节类型 | cc-harness 实现 | 类型 |
|----------|----------------|------|
| Maintainability | `tsc --strict`, ESLint | Computational |
| Architecture Fitness | `evals/` 测试框架 | Computational + Inferential |
| Behaviour | SKILL.md 定义 + 触发短语 | Feedforward |
| Behaviour | evals/ 输出验证 | Feedback |
