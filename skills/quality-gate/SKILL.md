---
name: quality-gate
description: Unified quality gate that runs verify → fix → verify loop. Supports review, test, and lint gates. Main agent delegates to this skill instead of managing feedback loops explicitly. Reads config for max iterations, updates workflow-state.md.
---

# Quality Gate

质量门技能，统一管理 review / test / lint 的质量验证循环。

## 何时激活

- 主工作流 agent 需要执行 review / test / lint 验证时
- 不显式暴露循环逻辑给调用方，调用方只需知道"通过"或"不通过"

## 核心模式

```
调用方: "run quality gate, type=review"
       │
       ▼
quality-gate:
  1. 读取配置 (maxIterations, thresholds)
  2. 执行 verify (type 对应的检查)
  3. 若通过 → 返回 PASS
  4. 若失败 → fix → verify → 循环
       │
       ├── 通过 → 返回 PASS
       ├── 仍失败 → fix → verify → 循环
       └── 达上限 → 返回 BLOCKED + 报告
```

**调用方不需要知道循环细节** — 只需调用 skill 并处理返回状态。

## 参数

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `type` | `review` \| `test` \| `lint` | 质量门类型 | **必填** |
| `target` | string | 检查目标 | `src/` |
| `configFile` | string | 工作流配置文件路径 | `.claude/workflow-config.yaml` |

## 执行流程

### 1. 读取配置

读取工作流配置文件 (`.claude/workflow-config.yaml`) 获取该类型的配置：

```yaml
qualityGates:
  review:
    maxIterations: 3
    agent: code-reviewer
    blockOnCritical: true
  test:
    maxIterations: 3
    agent: test-agent
    coverageThreshold: 80
  lint:
    maxIterations: 3
    agent: lint-agent
    failOnError: true
```

若配置文件不存在，使用默认值：

| 配置项 | 默认值 |
|--------|--------|
| maxIterations | 3 |
| coverageThreshold | 80 |
| failOnError | true |

### 2. 执行 Verify

根据 `type` 调用对应 agent：

| type | 调用的 Agent | 执行内容 |
|------|-------------|----------|
| `review` | `code-reviewer` | 代码审查，输出问题列表 |
| `test` | `test-agent` | 运行测试，验证覆盖率 |
| `lint` | `lint-agent` | 运行 lint + type check |

### 3. 判断结果

**通过条件：**

| type | 通过条件 |
|------|----------|
| `review` | 无 CRITICAL 问题，HIGH 问题可选修复 |
| `test` | 所有测试通过，覆盖率 >= threshold |
| `lint` | 无 Error (warnings 可选) |

**不通过条件：**

| type | 不通过条件 |
|------|-----------|
| `review` | 存在 CRITICAL/HIGH 问题 |
| `test` | 任何测试失败 或 覆盖率 < threshold |
| `lint` | 存在 Error |

### 4. Fix → Verify 循环

若不通过：

```
LOOP until (通过 || 迭代次数 >= maxIterations)
  1. 将错误信息传给 fix-agent
  2. fix-agent 应用修复
  3. 重新执行 verify
  4. 更新 workflow-state.md 的 iterationCount
END LOOP
```

每次迭代后更新状态：

```markdown
## Quality Gate Loop

**Gate:** review
**迭代:** 2/3
**状态:** IN_PROGRESS

| 迭代 | 时间 | 结果 | 问题数 |
|------|------|------|--------|
| 1 | 2026-04-03T10:30:00Z | FAIL | 3 HIGH |
| 2 | 2026-04-03T10:35:00Z | FAIL | 1 HIGH |
| 3 | 2026-04-03T10:40:00Z | - | - |

### 当前发现的问题
- [HIGH] Security: hardcoded API key in src/config.ts
```

### 5. 达到上限

达到最大迭代次数后：

```
## Quality Gate BLOCKED

**Gate:** review
**迭代:** 3/3 (已达上限)

**剩余问题:**
- [HIGH] Security: hardcoded API key in src/config.ts:42
- [HIGH] Error handling: missing try-catch in auth.ts:78

**人工介入需求:**
这些 HIGH 问题在 3 次自动修复循环后仍未解决，需要人工决策。
```

返回 `BLOCKED` 状态，等待人工介入或显式 override。

## 输出格式

### PASS

```markdown
## Quality Gate Result

**Type:** review
**Status:** PASS

**摘要:**
- 迭代次数: 1
- 发现问题: 0 CRITICAL, 0 HIGH
- 裁决: APPROVED
```

### PASS (after fixes)

```markdown
## Quality Gate Result

**Type:** test
**Status:** PASS

**摘要:**
- 迭代次数: 2/3
- 首次: FAIL (2 tests failed, coverage 72%)
- 最终: PASS (all tests pass, coverage 85%)
- 裁决: APPROVED
```

### FAIL

```markdown
## Quality Gate Result

**Type:** lint
**Status:** FAIL

**摘要:**
- 迭代次数: 3/3 (已达上限)
- ESLint: 2 errors, 5 warnings
- TypeScript: 1 error

**剩余问题:**
1. src/api/client.ts:42 - hardcoded API key (error)
2. src/auth/handler.ts:78 - missing try-catch (error)

**裁决:** BLOCKED — 需要人工介入
```

## 状态更新

每次执行后，更新 `.claude/workflow-state.md` 中的 loop 状态：

```json
{
  "qualityGates": {
    "review": {
      "status": "passed",
      "iterations": 2,
      "maxIterations": 3,
      "lastRun": "2026-04-03T10:35:00Z",
      "lastResult": "pass"
    },
    "test": {
      "status": "passed",
      "iterations": 1,
      "maxIterations": 3,
      "lastRun": "2026-04-03T10:40:00Z",
      "lastResult": "pass"
    },
    "lint": {
      "status": "pending",
      "iterations": 0,
      "maxIterations": 3,
      "lastRun": null,
      "lastResult": null
    }
  }
}
```

## 调用示例

### 主工作流中的调用方式

```
# 简单调用（推荐）
skill: quality-gate
type: review

skill: quality-gate
type: test

skill: quality-gate
type: lint
```

### 带配置的调用

```
skill: quality-gate
type: test
config:
  coverageThreshold: 90  # 自定义覆盖率要求
  maxIterations: 5       # 更多修复尝试

skill: quality-gate
type: review
config:
  maxIterations: 1       # 只允许一次修复
  blockOnCritical: true   # CRITICAL 直接阻止
```

### 主 agent 的处理逻辑

主 agent 无需知道循环细节：

```
when quality gate returns:
  - PASS → proceed to next phase
  - FAIL → return BLOCKED to user, wait for human decision
```

## 与其他 Agent 的关系

| Agent | 角色 | 关系 |
|-------|------|------|
| `code-reviewer` | verify | quality-gate 的 verify 步骤 |
| `test-agent` | verify | quality-gate 的 verify 步骤 |
| `lint-agent` | verify | quality-gate 的 verify 步骤 |
| `fix-agent` | fix | quality-gate 循环中的修复步骤 |
| `feature-development-workflow` | orchestrator | 调用 quality-gate 管理质量 |

## 设计原则

1. **单一职责** — quality-gate 只负责"验证循环"，不负责具体检查逻辑
2. **透明封装** — 调用方不需要知道循环存在
3. **可配置** — 通过 config 控制行为，不过度约束
4. **有界循环** — 始终有 maxIterations 保护，防止无限循环
5. **状态可见** — 所有迭代记录在 workflow-state.md

## 相关

- `skills/feature-development-workflow` — 调用 quality-gate 的主工作流
- `agents/code-reviewer` — review 类型 verify agent
- `agents/test-agent` — test 类型 verify agent
- `agents/lint-agent` — lint 类型 verify agent
- `agents/fix-agent` — 循环中的修复 agent
