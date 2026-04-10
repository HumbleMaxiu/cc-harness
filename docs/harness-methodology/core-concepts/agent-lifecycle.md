# Agent 生命周期管理

> 来源：[Harness Engineering Academy](https://harness-engineering.ai/blog/what-is-harness-engineering/)、[Anthropic: Agentic Patterns](https://docs.anthropic.com/en/docs/build-agentics)

---

## Agent 生命周期概览

```
启动 (Boot)
    ↓
Orient（定位）
    ↓
Execute（执行）
    ↓
Verify（验证）
    ↓
完成 / 暂停 / 失败
```

---

## 阶段详解

### 1. 启动阶段（Boot）

**目标**：建立 Agent 运行环境。

**必要步骤**：
1. 读取 AGENTS.md（顶层索引）
2. 读取项目进度文件（如有）
3. 读取最近 Git 提交历史
4. 检查当前会话状态

**最佳实践**：
```bash
# 环境检查脚本
- 检查 Node.js / Python 版本
- 检查依赖是否安装
- 检查环境变量
- 运行 baseline 验证
```

### 2. Orient 阶段（定位）

**目标**：理解当前状态和任务。

**必要步骤**：
1. 读取任务规格文件
2. 检查现有代码结构
3. 识别相关文件和模块
4. 确认任务边界

**检查清单**：
```
□ 任务规格文件存在且最新
□ 相关代码文件已定位
□ 依赖关系已理解
□ 边界条件已识别
□ 风险点已记录
```

### 3. Execute 阶段（执行）

**目标**：完成具体任务。

**执行原则**：
- 一次只做一件事
- 每个变更后验证
- 保持变更集小而可审查

**执行循环**：
```
实现一个小变更
    ↓
运行相关测试
    ↓
测试通过？ → 是 → 记录进度 → 下一个变更
    ↓ 否
修复问题
    ↓
再次测试
```

### 4. Verify 阶段（验证）

**目标**：确保输出符合要求。

**验证步骤**：
1. 运行完整测试套件
2. 类型检查通过
3. Lint 检查通过
4. 人工审查（如需要）

**验证不通过的处理**：
```
测试失败
    ↓
分析失败原因
    ↓
是实现问题？ → 修复实现
    ↓ 是
是测试问题？ → 修复测试
    ↓
无法修复？ → 记录问题并上报
```

---

## Agent 健康检查

### 监控指标

| 指标 | 正常范围 | 异常处理 |
|------|----------|----------|
| 上下文使用率 | < 80% | 触发摘要 |
| 工具调用成功率 | > 95% | 检查工具定义 |
| 循环检测 | 无重复模式 | 记录并上报 |
| Token 消耗速率 | 稳定 | 设置预算上限 |

### 异常状态处理

```typescript
// 健康检查伪代码
function healthCheck(agentState: AgentState): HealthStatus {
  if (contextUsage > 0.8) {
    return HealthStatus.CONTEXT_OVERFLOW;
  }

  if (detectLoop(agentState.history)) {
    return HealthStatus.STUCK_IN_LOOP;
  }

  if (tokenBudget.exceeded()) {
    return HealthStatus.BUDGET_EXCEEDED;
  }

  return HealthStatus.HEALTHY;
}
```

---

## 会话边界管理

### 何时结束会话

| 信号 | 处理 |
|------|------|
| 任务完成 | 记录总结，优雅退出 |
| 上下文耗尽 | 触发摘要，继续或结束 |
| 循环检测 | 记录状态，请求人工介入 |
| Token 预算超限 | 停止，记录进度 |
| 用户主动取消 | 保存状态，退出 |

### 会话结束清单

```
□ 所有文件变更已保存
□ 测试全部通过
□ 进度文件已更新
□ 总结已写入日志
□ 状态已持久化（可恢复）
□ 上下文已释放
```

---

## 长时任务支持

### 检查点机制

```typescript
interface Checkpoint {
  taskId: string;
  completedSteps: Step[];
  currentStep: number;
  context: string;  // 压缩后的上下文摘要
  timestamp: Date;
}

// 每个关键步骤后保存检查点
async function saveCheckpoint(task: Task): Promise<void> {
  await fs.writeFile(
    `.checkpoints/${task.id}.json`,
    JSON.stringify({
      taskId: task.id,
      completedSteps: task.completedSteps,
      currentStep: task.currentStep,
      context: summarizeContext(task.context),
      timestamp: new Date()
    })
  );
}
```

### 恢复流程

```
恢复会话
    ↓
读取检查点
    ↓
恢复压缩上下文
    ↓
确认任务目标未变化
    ↓
继续执行
```
