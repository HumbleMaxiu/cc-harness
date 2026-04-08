# Quality Gate Loop State

质量门循环状态追踪文档。`quality-gate` skill 读取此文件获取当前状态，并更新迭代记录。

## 状态文件位置

`.claude/workflow-state.md`

## 状态格式

```markdown
# Workflow State

## 基本信息
- **Workflow ID**: feature-xxx
- **类型**: feature
- **描述**: 添加用户认证
- **状态**: in_progress | completed | blocked
- **开始时间**: 2026-04-03T10:00:00Z

## Quality Gates

| Gate | 状态 | 迭代 | 结果 | 上限 |
|------|------|------|------|------|
| review | ✓ PASS | 2/3 | pass | 3 |
| test | ● IN_PROGRESS | 1/3 | - | 3 |
| lint | ○ PENDING | 0/3 | - | 3 |

### Review Loop History
| 迭代 | 时间 | 结果 | 问题数 |
|------|------|------|--------|
| 1 | 2026-04-03T10:30:00Z | FAIL | 3 HIGH |
| 2 | 2026-04-03T10:35:00Z | PASS | 0 |

### Test Loop History
| 迭代 | 时间 | 结果 | 问题数 |
|------|------|------|--------|
| 1 | 2026-04-03T10:40:00Z | FAIL | 2 failed tests |

### Lint Loop History
| 迭代 | 时间 | 结果 | 问题数 |
|------|------|------|--------|
| - | - | - | - |
```

## JSON 格式 (内部使用)

```json
{
  "workflowId": "feature-xxx",
  "status": "in_progress",
  "currentPhase": "quality-gate:review",
  "qualityGates": {
    "review": {
      "status": "passed",
      "iterations": 2,
      "maxIterations": 3,
      "lastRun": "2026-04-03T10:35:00Z",
      "lastResult": "pass",
      "history": [
        {
          "iteration": 1,
          "timestamp": "2026-04-03T10:30:00Z",
          "result": "fail",
          "issuesFound": 3,
          "severityBreakdown": {
            "critical": 0,
            "high": 3,
            "medium": 0,
            "low": 0
          }
        },
        {
          "iteration": 2,
          "timestamp": "2026-04-03T10:35:00Z",
          "result": "pass",
          "issuesFound": 0
        }
      ]
    },
    "test": {
      "status": "in_progress",
      "iterations": 1,
      "maxIterations": 3,
      "lastRun": "2026-04-03T10:40:00Z",
      "lastResult": "fail",
      "history": []
    },
    "lint": {
      "status": "pending",
      "iterations": 0,
      "maxIterations": 3,
      "lastRun": null,
      "lastResult": null,
      "history": []
    }
  },
  "totalIterations": 3,
  "maxTotalIterations": 10
}
```

## 状态流转

```
PENDING → IN_PROGRESS → PASSED
                      → BLOCKED (达到上限)
                      → SKIPPED (配置跳过)
```

## 更新规则

1. **进入 gate 时**: 设置状态为 `IN_PROGRESS`
2. **每次迭代**:
   - 记录到 history
   - 更新 iterations 计数
   - 更新 lastRun 时间
3. **通过时**: 设置状态为 `PASSED`
4. **达到上限时**: 设置状态为 `BLOCKED`，通知用户

## 循环次数上限

- **单 Gate 上限**: 由 `qualityGates.<type>.maxIterations` 配置，默认 3
- **全局上限**: `global.maxTotalIterations` 控制所有 gate 的总迭代次数，默认 10

达到全局上限时，整个工作流阻塞，等待人工介入。
