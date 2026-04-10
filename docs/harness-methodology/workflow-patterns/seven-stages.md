# 七阶段工作流（MEV 模式）

> 来源：[MEV: Agentic Workflows](https://mev.com/blog/agentic-workflows-stages-roles-validators-approvals)

---

## 概述

MEV（Move fast, stay safe）提出的七阶段模型是业界最完整的 Agent 工作流定义之一。

**核心原则**：
- **Execute proposes. Commit writes.**
- 工作流可以读取系统、收集事实、准备变更清单，但写入必须显式且可验证

---

## 七阶段详解

```
┌─────────────────────────────────────────────────────────────┐
│  1. Intake      →  2. Triage   →  3. Plan                │
│  "这是关于什么的？"  "该怎么做？"    "具体步骤是什么？"        │
│                                                              │
│  4. Execute     →  5. Validate →  6. Commit                │
│  "执行并收集证据"   "证明安全正确"   "写入变更"              │
│                                                              │
│  7. Audit                                                       │
│  "记录全部过程"                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 阶段 1：Intake（摄取）

**目标**：将模糊输入转为结构化 Case。

**核心问题**：
```
- 这是关于什么的？
- 涉及哪个客户/订单/实体？
- 缺少什么信息？
```

**如果无法命名要操作的实体，就不应操作任何东西。**

### Intake 的输出

```json
{
  "case_id": "uuid",
  "summary": "用户请求创建 Skill",
  "entities": {
    "skill_name": "docs-generator",
    "parent_directory": ".claude/skills/",
    "owner": "xiuma"
  },
  "missing_info": [],
  "follow_up_questions": [],
  "confidence": 0.95,
  "risk_level": "low"
}
```

### Intake 的门控

> **如果无法以置信度命名实体，停止并询问或上报。**

```
Entity 无法命名？
    ↓ 是
停止 → 请求澄清 → 等待用户响应
    ↓ 否
进入 Triage 阶段
```

---

## 阶段 2：Triage（分诊）

**目标**：决定做什么以及如何做。

**核心问题**：
```
- 这是什么类型的任务？
- 应该走哪个工作流？
- 优先级是什么？
- 需要哪些工具？
```

### Triage 决策表

| 输入类型 | 工作流 | 优先级 |
|----------|--------|--------|
| "创建一个 Skill" | `skill-creator` | P1 |
| "初始化项目 Harness" | `harness-init` | P0 |
| "更新文档" | `docs-generator` | P2 |
| "搜索最新信息" | `exa-search` | P3 |

---

## 阶段 3：Plan（规划）

**目标**：定义从当前状态到目标状态的路径。

**核心问题**：
```
- 完成任务的步骤是什么？
- 何时停止？
- 允许使用哪些工具？
- 风险级别是什么？
```

### Plan 的输出

```json
{
  "plan_id": "uuid",
  "steps": [
    {
      "step": 1,
      "action": "读取现有 SKILL.md 模板",
      "tool": "read_file",
      "expected_output": "模板内容"
    },
    {
      "step": 2,
      "action": "创建 skill 目录结构",
      "tool": "create_directory",
      "expected_output": "目录创建成功"
    },
    {
      "step": 3,
      "action": "生成 SKILL.md",
      "tool": "write_file",
      "expected_output": "文件内容符合 schema"
    }
  ],
  "stop_conditions": [
    "所有文件创建完成",
    "Token 消耗 > 80%"
  ],
  "allowed_tools": [
    "read_file",
    "create_directory",
    "write_file"
  ],
  "risk_level": "low",
  "requires_approval": false
}
```

### Plan 的门控

> **如果计划使用了不允许的工具或缺少停止条件，拒绝或修复。**

```
Plan 使用了不允许的工具？
    ↓ 是
拒绝计划 → 请求修复 → 重新规划
    ↓ 否
进入 Execute 阶段
```

---

## 阶段 4：Execute（执行）

**目标**：调用工具，收集证据。

**核心原则**：
- 执行是显式的，没有隐藏副作用
- 每一步都收集证据
- 准备好变更清单（Proposed Change Set）

### Execute 的输出

```json
{
  "execution_id": "uuid",
  "evidence": [
    {
      "step": 1,
      "tool": "read_file",
      "input": { "path": "template.md" },
      "output": "文件内容...",
      "status": "success",
      "duration_ms": 45
    },
    {
      "step": 2,
      "tool": "create_directory",
      "input": { "path": "new-skill" },
      "output": "创建成功",
      "status": "success",
      "duration_ms": 12
    }
  ],
  "proposed_changes": [
    {
      "type": "create",
      "path": "new-skill/SKILL.md",
      "content": "..."
    }
  ],
  "errors": [],
  "retries": 0
}
```

---

## 阶段 5：Validate（验证）

**目标**：证明变更安全且正确。

**验证类型**：

| 验证类型 | 问题 | 实现 |
|----------|------|------|
| Shape/Schema | 载荷格式正确吗？ | JSON Schema 验证 |
| Preconditions | 当前状态允许此操作吗？ | 状态检查 |
| Business Rules | 符合策略吗？ | 规则引擎 |
| Cross-System | 各系统一致吗？ | 数据对比 |

### Validate 的输出

```json
{
  "validation_id": "uuid",
  "passed": true,
  "checks": [
    {
      "type": "schema",
      "name": "SKILL.md frontmatter",
      "passed": true,
      "details": "name, description 字段存在"
    },
    {
      "type": "schema",
      "name": "目录结构",
      "passed": true,
      "details": "必需目录都存在"
    },
    {
      "type": "business_rule",
      "name": "无内部路径泄漏",
      "passed": true,
      "details": "文档地图不含 .claude/ 路径"
    }
  ],
  "reason": null,
  "next_action": "proceed_to_commit"
}
```

### Validate 的门控

```
验证通过？
    ↓ 否
回退 → 修复问题 → 重新执行
    ↓ 是
进入 Commit 阶段
```

---

## 阶段 6：Commit（提交）

**目标**：将变更写入系统。

**核心原则**：
- **Execute proposes. Commit writes.**
- 只有通过 Validate 阶段才能写入
- 变更必须可回滚

### Commit 的执行

```bash
# 示例：Skill 创建的 Commit
git add .claude/skills/docs-generator/
git commit -m "feat: add docs-generator skill"
```

---

## 阶段 7：Audit（审计）

**目标**：记录全部过程，用于回溯和学习。

### Audit 记录

```json
{
  "audit_id": "uuid",
  "run_id": "run_20260410_001",
  "stages": [
    { "stage": "intake", "duration_ms": 120, "output": {...} },
    { "stage": "triage", "duration_ms": 45, "output": {...} },
    { "stage": "plan", "duration_ms": 200, "output": {...} },
    { "stage": "execute", "duration_ms": 1500, "output": {...} },
    { "stage": "validate", "duration_ms": 300, "output": {...} },
    { "stage": "commit", "duration_ms": 100, "output": {...} },
    { "stage": "audit", "duration_ms": 50, "output": {...} }
  ],
  "total_duration_ms": 2315,
  "status": "success",
  "token_usage": {
    "input": 5000,
    "output": 2000
  }
}
```

---

## 执行阶段与门控速查表

| 阶段 | 产出 | 门控规则 |
|------|------|----------|
| **Intake** | Case 文件（实体 ID、缺失信息） | 实体无法命名 → 停止 |
| **Triage** | 工作流选择、优先级 | — |
| **Plan** | 步骤列表、停止条件 | 使用不允许工具 → 拒绝 |
| **Execute** | 证据、变更清单 | — |
| **Validate** | 验证报告（通过/失败） | 失败 → 回退修复 |
| **Commit** | 变更已写入 | — |
| **Audit** | 完整运行记录 | — |

---

## 对 cc-harness 的映射

| MEV 阶段 | cc-harness 实现 |
|----------|----------------|
| Intake | `harness-init` 读取项目状态 |
| Triage | Skill 触发短语匹配 |
| Plan | Skill 的"工作流"章节 |
| Execute | Skill 执行具体操作 |
| Validate | `evals/` 测试验证 |
| Commit | Git commit |
| Audit | 运行日志记录 |
