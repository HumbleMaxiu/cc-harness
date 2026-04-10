# 预完成清单

> 来源：[AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/)

---

## 核心问题

> "Agents optimize for task completion, not task correctness. They stop as soon as output looks plausible — not when it is verified correct."

Agent 会优化任务完成，而非任务正确性。它们在输出看起来 plausible 时就停止，而非验证正确后停止。

**预完成清单**拦截完成信号，在 Agent 被允许结束前强制进入验证序列。

---

## 四阶段验证序列

```
Agent 宣布"完成"
      ↓
预完成清单拦截
      ↓
┌────────────────────────────────────────────────────────────┐
│ 1. Planning    →  2. Building   →  3. Verification → 4. Fixing │
│ 你理解需求了吗？    你实现了吗？      验证通过了吗？         修复问题了吗？     │
└────────────────────────────────────────────────────────────┘
      ↓
清单全部通过 → Agent 可以结束
清单有未通过 → 返回修复
```

---

## 阶段 1：Planning（规划验证）

**问题**：我在开始前理解需求了吗？

### 检查清单

```markdown
## Planning 验证

### 需求澄清
- [ ] 我重述了用户的需求
- [ ] 我列出了假设
- [ ] 我确认了假设（如必要）
- [ ] 我识别了模糊点

### 成功标准
- [ ] 我知道如何衡量成功
- [ ] 我有可验证的验收标准
- [ ] 我知道什么时候停止

### 风险识别
- [ ] 我识别了潜在风险
- [ ] 我有缓解计划
```

### 失败信号

```
用户说"创建 Skill"
    ↓
Agent 直接开始创建
    ↓
清单问：你确认了 Skill 的用途和范围吗？
    ↓
Agent 没有答案 → 暂停，返回 Clarify 阶段
```

---

## 阶段 2：Building（构建验证）

**问题**：我实现了规格要求，还是一个更简单的替代品？

### 检查清单

```markdown
## Building 验证

### 功能完整性
- [ ] 所有必需功能已实现
- [ ] 没有偷工减料的实现
- [ ] 边界情况已处理

### 规格符合度
- [ ] 实现了 specification，而非替代方案
- [ ] API 签名符合要求
- [ ] 行为符合预期

### 代码质量
- [ ] 代码可读
- [ ] 无明显的代码异味
- [ ] 遵循项目约定
```

### 常见偷工减料模式

```typescript
// ❌ 假的实现（看起来有，实际没有）
async function createUser(data: UserData): Promise<User> {
  // Agent 创建了一个看起来完整的函数
  // 但没有真正写入数据库
  return { ...data, id: "fake-id" };
}

// ✅ 真实实现
async function createUser(data: UserData): Promise<User> {
  const user = await db.users.create(data);
  await eventBus.emit("user.created", { userId: user.id });
  return user;
}
```

---

## 阶段 3：Verification（验证）

**问题**：我运行了端到端测试、回归检查、确认输出满足规格了吗？

### 检查清单

```markdown
## Verification 验证

### 测试执行
- [ ] 单元测试运行且通过
- [ ] 类型检查通过
- [ ] Lint 检查通过
- [ ] 集成测试（如有）通过

### 回归检查
- [ ] 现有功能未被破坏
- [ ] 没有引入新的 lint 警告
- [ ] 构建仍然成功

### 规格确认
- [ ] 输出符合规格描述
- [ ] 行为与预期一致
- [ ] 性能在可接受范围
```

### 验证必须可执行

```markdown
❌ 模糊验证
"检查代码看起来没问题"

✅ 具体验证
"运行 npm test 且所有测试通过
运行 tsc --noEmit 且无错误
运行 npm run lint 且无警告"
```

---

## 阶段 4：Fixing（修复）

**问题**：我在验证中发现的问题都被修复了吗？

### 检查清单

```markdown
## Fixing 验证

### 修复状态
- [ ] 验证中发现的所有问题已修复
- [ ] 修复后重新运行了测试
- [ ] 修复没有引入新问题

### 质量确认
- [ ] 代码质量达到标准
- [ ] 测试覆盖率满足要求
- [ ] 文档已更新（如需要）
```

---

## 完整预完成清单模板

```markdown
## 预完成清单

### 阶段 1: Planning
- [ ] 需求已澄清并确认
- [ ] 假设已列出并验证
- [ ] 成功标准已定义

### 阶段 2: Building
- [ ] 实现了规格要求，非替代方案
- [ ] 所有必需功能已实现
- [ ] 边界情况已处理

### 阶段 3: Verification
- [ ] 测试运行且通过
- [ ] 类型检查通过
- [ ] Lint 检查通过
- [ ] 规格确认满足

### 阶段 4: Fixing
- [ ] 所有问题已修复
- [ ] 修复后测试仍通过
- [ ] 质量达到标准

### 最终确认
- [ ] 变更可回滚
- [ ] 文档已更新
- [ ] 可以向用户展示结果
```

---

## 收敛检测

对于代码任务，停止标准很清晰：**测试通过**。

对于文档和设计文档，没有这样的客观标准。

### 收敛标准

| 产出类型 | 收敛标准 |
|----------|----------|
| 代码 | 所有测试通过 |
| 文档 | 包含所有必需章节，格式正确 |
| API 设计 | Schema 验证通过，评审通过 |
| 架构决策 | ADR 文档完整，影响评估完成 |

### 与硬性最大轮次限制配对

> 始终将收敛检测与硬性最大轮次限制配对作为成本回退。

```python
def execute_with_convergence_check(
    task: Task,
    max_rounds: int = 10
) -> Result:
    """带收敛检测的执行"""

    for round_num in range(max_rounds):
        result = execute_one_round(task)

        # 收敛检测
        if is_converged(result):
            return result

        # 收敛检测失败，但还有机会
        if round_num < max_rounds - 1:
            continue

    # 达到最大轮次
    logger.warning(f"Max rounds ({max_rounds}) reached")
    return create_partial_result(task, reason="max_rounds")
```

---

## 对 cc-harness 的实现

### 在 SKILL.md 中嵌入清单

```yaml
---
name: harness-init
description: "编排完整项目初始化流程"
---

# 预完成清单

在宣布完成前，必须确认：

## Planning
- [ ] 项目类型已识别
- [ ] 复杂度已评估
- [ ] 用户需求已澄清

## Building
- [ ] AGENTS.md 已生成
- [ ] docs/ 结构已创建
- [ ] init.sh 已生成（如需要）

## Verification
- [ ] 文件存在性检查通过
- [ ] YAML 格式正确
- [ ] 内容符合模板

## Fixing
- [ ] 所有验证问题已修复
- [ ] 质量达到标准
```

### 实现为生命周期钩子

```typescript
// hooks/pre-completion.ts
const PRE_COMPLETION_CHECKLIST = {
  stages: [
    {
      name: "Planning",
      questions: [
        "你是否理解用户的需求？",
        "你是否识别了假设？"
      ]
    },
    {
      name: "Building",
      questions: [
        "你实现了所有必需功能吗？",
        "你是否用了替代方案？"
      ]
    },
    {
      name: "Verification",
      questions: [
        "测试通过了吗？",
        "Lint 通过了吗？"
      ]
    },
    {
      name: "Fixing",
      questions: [
        "发现的问题都修复了吗？"
      ]
    }
  ]
};

export async function runPreCompletionChecklist(
  agent: Agent
): Promise<boolean> {
  for (const stage of PRE_COMPLETION_CHECKLIST.stages) {
    const answers = await agent.askQuestions(stage.questions);

    if (!allPassed(answers)) {
      await agent.fixIssues(stage.name);
      return false;  // 重新进入验证循环
    }
  }

  return true;  // 全部通过，可以结束
}
```
