# 人工介入模式（Human-in-the-Loop）

> 来源：[Harness Engineering Academy](https://harnessengineering.ai/blog/production-ai-agent-deployment-the-complete-operations-guide/)、[Zapier](https://zapier.com/blog/human-in-the-loop/)、[AgentMelt](https://agentmelt.com/blog/ai-agent-workflow-orchestration-patterns/)

---

## 为什么需要人工介入

> "Not every agent action should be autonomous."

即使是最可靠的 Agent 系统，也需要人工介入来：
1. 防止不可逆的错误
2. 保持人类对系统的信任
3. 满足合规和审计要求

---

## 人工介入的时机

### 必须介入的情况

| 情况 | 原因 | 示例 |
|------|------|------|
| **不可逆操作** | 动作无法撤消 | 删除数据库、删除文件 |
| **高风险操作** | 错误代价高昂 | 部署到生产、发送外部邮件 |
| **合规要求** | 监管要求 | 财务交易、隐私数据访问 |
| **低置信度** | Agent 对输出不确定 | 多个可行方案 |

### 不需要介入的情况

| 情况 | 原因 |
|------|------|
| 只读操作 | 无数据改变风险 |
| 低风险操作 | 错误代价可控 |
| 高频小操作 | 人工介入成本太高 |

---

## 人工介入模式

### 1. 审批门控（Approval Gate）

```
Agent 提议变更
    ↓
暂停，等待人工审批
    ↓
批准 → 执行变更
拒绝 → 记录拒绝原因 → 调整后重新提交
```

```typescript
interface ApprovalGate {
  id: string;
  trigger: "always" | "risk_threshold" | "confidence_threshold";
  riskLevel: "low" | "medium" | "high";
  approvers: string[];  // 角色或用户名
  timeout?: number;      // 超时时间（秒）
}

const APPROVAL_GATES = [
  {
    id: "deploy_production",
    trigger: "always",
    riskLevel: "high",
    approvers: ["release-manager", "tech-lead"]
  },
  {
    id: "delete_file",
    trigger: "always",
    riskLevel: "medium",
    approvers: ["owner"]
  },
  {
    id: "create_pr",
    trigger: "confidence_threshold",
    confidenceThreshold: 0.7,
    approvers: ["self"]  // 仅通知，不阻止
  }
];
```

### 2. 风险触发审批（Risk-Triggered Approval）

只有当风险超过阈值时才请求审批：

```typescript
function shouldRequireApproval(action: Action): boolean {
  // 始终需要审批的操作
  if (action.type === "delete" && action.scope === "production") {
    return true;
  }

  // 置信度低于阈值时需要审批
  if (action.confidence < 0.8) {
    return true;
  }

  // 多选项时需要审批
  if (action.alternatives && action.alternatives.length > 1) {
    return true;
  }

  return false;
}
```

### 3. 收集数据（Collect Data）

不是简单的批准/拒绝，而是收集必要信息：

```typescript
interface HumanInputRequest {
  type: "approval" | "selection" | "data_collection";
  summary: string;           // Agent 预处理的信息
  options?: string[];        // 选项列表（如 selection）
  fields?: FormField[];      // 数据字段（如 data_collection）
  reasoning: string;         // Agent 的推理过程
}
```

---

## 审批流程示例

### 创建 Skill 的审批

```
Agent 提议：创建 docs-generator Skill

包含：
- Skill 名称：docs-generator
- 用途：为项目生成 docs/ 目录
- 文件：SKILL.md, references/*

风险评估：
- 风险级别：低
- 影响：创建文件，可回滚
- 置信度：0.95

↓ 置信度 > 0.8，无需审批
↓ 自动执行
```

### 部署到生产的审批

```
Agent 提议：部署 v2.0.0 到生产环境

包含：
- 版本：v2.0.0
- 变更：新增 docs-generator
- 测试结果：L1 ✓ L2 ✓ L3 ✓
- 风险评估：中等

风险评估：
- 风险级别：高
- 影响：生产环境变更
- 置信度：0.85

↓ 需要人工审批
↓
审批者看到：
- 变更摘要
- 测试结果
- 回滚计划
- 潜在风险

↓ 批准 / 拒绝
```

---

## 人工介入的成本与收益

| 指标 | 无人工介入 | 有人工介入 |
|------|-----------|-----------|
| 速度 | 快 | 慢（等待审批） |
| 风险 | 高 | 低 |
| 信任 | 低 | 高 |
| 适用场景 | 高频、低风险 | 低频、高风险 |

### 最佳平衡

```
初始阶段：严格审批（建立信任）
    ↓
随时间推移：根据置信度动态调整
    ↓
成熟阶段：仅高风险操作需要审批
```

---

## 对 cc-harness 的建议

### 审批门控配置

```yaml
# harness-init/config/approval-gates.yaml
approval_gates:
  - name: "创建新 Skill"
    trigger: "always"  # 始终需要确认
    risk_level: "low"
    prompt: "是否创建此 Skill？"

  - name: "删除文件"
    trigger: "always"
    risk_level: "medium"
    prompt: "确认删除以下文件？"

  - name: "修改现有 Skill"
    trigger: "risk_threshold"
    risk_threshold: 0.3  # 超过 30% 变更时需要审批
    prompt: "此 Skill 有较大修改，是否继续？"
```

### 实现人工介入的伪代码

```typescript
async function executeWithHumanInLoop(
  action: Action,
  gates: ApprovalGate[]
): Promise<Result> {
  const applicableGate = gates.find(g =>
    g.trigger === "always" ||
    (g.trigger === "risk_threshold" && action.riskLevel > g.riskThreshold) ||
    (g.trigger === "confidence_threshold" && action.confidence < g.confidenceThreshold)
  );

  if (!applicableGate) {
    // 无需审批，直接执行
    return await execute(action);
  }

  // 请求人工审批
  const approval = await requestHumanApproval({
    summary: summarizeAction(action),
    reasoning: explainReasoning(action),
    options: action.alternatives || ["批准", "拒绝"],
    timeout: applicableGate.timeout
  });

  if (approval === "approved") {
    return await execute(action);
  } else {
    return {
      status: "rejected",
      reason: approval.reason,
      suggestedAlternatives: approval.suggestions
    };
  }
}
```

---

## 最佳实践

1. **不要太严格**：太多审批会降低 Agent 效率，不如手动执行
2. **不要太宽松**：太少审批会导致风险失控
3. **提供上下文**：审批者需要足够信息做决策
4. **明确回滚计划**：让审批者知道如何撤消
5. **记录决策**：为未来审计保留审批历史
