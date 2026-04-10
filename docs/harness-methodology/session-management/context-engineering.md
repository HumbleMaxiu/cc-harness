# 上下文工程

> 来源：[Harness Engineering Academy](https://harnessengineering.ai/blog/what-is-harness-engineering/)、[Anthropic: Context Management](https://docs.anthropic.com/en/docs/build-agentics)

---

## 什么是上下文工程

**上下文工程 = 决定模型在每个执行步骤中看到什么信息。**

这不是简单的"给模型更多信息"。关键是：
> "Exactly what the agent needs for each specific step. Not dumping everything."

---

## 上下文工程的挑战

| 问题 | 表现 |
|------|------|
| **Too Little** | Agent 缺少做决策所需的信息 |
| **Too Much** | 上下文窗口填满，质量下降 |
| **Wrong Content** | Agent 被无关信息干扰 |
| **Stale Context** | 旧信息导致 Agent 做错误决策 |

---

## 上下文层级

```
┌─────────────────────────────────────────────────────────────┐
│ L0: System Context（系统级）                                 │
│ - 持久：项目规范、编码约定、架构原则                         │
├─────────────────────────────────────────────────────────────┤
│ L1: Session Context（会话级）                               │
│ - 当前会话：任务目标、最近对话、工具调用历史                  │
├─────────────────────────────────────────────────────────────┤
│ L2: Step Context（步骤级）                                  │
│ - 当前步骤：具体任务、相关文件、预期输出                     │
├─────────────────────────────────────────────────────────────┤
│ L3: Tool Context（工具级）                                  │
│ - 工具调用：输入参数、输出结果、错误信息                      │
└─────────────────────────────────────────────────────────────┘

容量：L0 + L1 + L2 + L3 < 上下文窗口的 80%
```

---

## 上下文管理策略

### 1. Token 预算追踪

```typescript
interface TokenBudget {
  maxTokens: number;      // 模型最大上下文
  warningThreshold: number; // 警告阈值（如 70%）
  criticalThreshold: number; // 临界阈值（如 85%）
  emergencyAction: string;   // 紧急行动
}

const DEFAULT_BUDGET: TokenBudget = {
  maxTokens: 200000,        // Claude 200K 上下文
  warningThreshold: 0.7,    // 70%
  criticalThreshold: 0.85,  // 85%
  emergencyAction: "summarize" // 触发摘要
};

function checkTokenBudget(
  currentUsage: number,
  budget: TokenBudget = DEFAULT_BUDGET
): void {
  const usageRatio = currentUsage / budget.maxTokens;

  if (usageRatio >= budget.criticalThreshold) {
    // 临界状态：立即摘要
    triggerSummary();
  } else if (usageRatio >= budget.warningThreshold) {
    // 警告状态：计划摘要
    planFutureSummary();
  }
}
```

### 2. 渐进上下文加载

```
❌ BAD：启动时加载所有文件
context = loadAllProjectFiles()  // 浪费大量 token

✅ GOOD：按需加载
context = loadEssentialFiles()
if (needsMoreInfo()) {
  context += loadRelevantFiles()
}
```

### 3. 上下文压缩

```typescript
interface CompressedContext {
  original: string;
  summary: string;
  keyPoints: string[];
  preservedIds: string[];  // 保留的 ID、路径等
}

function compressContext(
  context: string,
  maxTokens: number
): CompressedContext {
  // 提取关键点
  const keyPoints = extractKeyPoints(context);

  // 生成摘要
  const summary = generateSummary(context, {
    maxTokens: maxTokens * 0.3
  });

  // 保留重要 ID 和路径
  const preservedIds = extractIdsAndPaths(context);

  return {
    original: context,
    summary,
    keyPoints,
    preservedIds
  };
}
```

---

## 上下文注入策略

### Skill 上下文

```yaml
# SKILL.md 的上下文注入
---
name: skill-creator
description: "创建 Claude Code Skills"
context:
  load_order:
    - AGENTS.md
    - skill-creator/SKILL.md
    - agents-md-guide/SKILL.md  # 依赖的 Skill
  max_context_tokens: 50000
---

# 这样 Agent 知道：
# 1. 项目整体规范（AGENTS.md）
# 2. 当前 Skill 的职责（skill-creator/SKILL.md）
# 3. 相关 Skill 的接口（agents-md-guide/SKILL.md）
```

### 工具调用上下文

```typescript
// 好的工具定义：提供清晰上下文
const TOOLS = [
  {
    name: "read_file",
    description: "读取文件内容",
    input: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "文件路径，相对于项目根目录"
        },
        maxLines: {
          type: "number",
          description: "最大行数，默认 100。避免一次读取过大文件"
        }
      }
    }
  }
];
```

---

## 渐进披露原则

> "Keep the top-level instruction file short (~100 lines). Use it as a table of contents pointing to deeper sources of truth."

### 文档层级

```
AGENTS.md (~100 行)
  ├── docs/architecture.md (~200 行)
  │   ├── docs/modules/user-service.md (~100 行)
  │   └── docs/modules/order-service.md (~100 行)
  ├── docs/conventions.md (~150 行)
  └── docs/testing.md (~150 行)
```

### 上下文选择原则

| 情况 | 加载什么 | 不加载什么 |
|------|----------|------------|
| 启动会话 | AGENTS.md、项目概览 | 详细模块文档 |
| 修改变量 | 相关文件 + 约定 | 不相关模块 |
| 重构 | 受影响模块 + 架构文档 | UI 层（如无关）|
| 添加测试 | 测试约定 + 相关代码 | 全部代码 |

---

## 上下文工程最佳实践

### 1. 明确命名

```markdown
❌ 模糊命名
"module1/src/utils/helpers.ts"

✅ 清晰命名
"auth-service/src/validators/userCredentials.ts"
```

### 2. 导出一致性

```typescript
// ❌ 分散导出
// auth/validators.ts
export { validateEmail } from "./email";

// ❌ 无导出
// auth/helpers.ts
function hashPassword() {}

// ✅ 统一导出
// auth/index.ts
export { validateEmail } from "./email";
export { validatePassword } from "./password";
export * from "./validators";
```

### 3. 类型即文档

```typescript
// ❌ 无类型
function createUser(data) {
  return db.create(data);
}

// ✅ 显式类型
interface UserInput {
  email: string;      // 必填，唯一
  name: string;      // 必填，显示名
  role: UserRole;    // 必填，默认 'user'
  metadata?: Record<string, unknown>;  // 可选
}

async function createUser(data: UserInput): Promise<User> {
  return db.users.create(data);
}
```

---

## 对 cc-harness 的上下文管理

### AGENTS.md 的上下文策略

```markdown
# AGENTS.md

> 本文件约 100 行，是项目规范的入口索引

## 快速导航
[3-5 个关键链接]

## 项目概述
[2-3 句话 + 技术栈]

## 核心约定
[5-7 个最重要约定]

## Documentation Map
[指向 docs/ 的链接]

---
详细规范请阅读：
- [docs/architecture.md](docs/architecture.md)
- [docs/conventions.md](docs/conventions.md)
```

### Skill 加载顺序

```yaml
# skill-creator/SKILL.md
context:
  # 每次执行时加载（必需）
  always_load:
    - AGENTS.md
    - skill-creator/SKILL.md

  # 按需加载（优化 token 使用）
  load_if_needed:
    - docs/conventions.md  # 编码约定
    - harness-methodology/ # 方法论文档
```
