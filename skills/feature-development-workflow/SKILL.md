---
name: feature-development-workflow
description: Complete feature development workflow orchestrating spec → tdd → develop → review → fix → pr pipeline. Use when user requests a full feature implementation or /feature-flow command is invoked.
origin: ECC
---

# Feature Development Workflow

自动化端到端功能开发流程，在专用 agents 之间进行智能交接。

## 何时激活

- 用户调用 `/feature-flow` 命令
- 用户说 "implement feature", "new feature workflow", "run the full pipeline"
- 需要协调多个 agents 的复杂功能

## 工作流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入                                   │
│                    (功能需求 / Bug 报告)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SPEC AGENT                                 │
│                    需求分析与 User Stories                        │
│                                                                  │
│  输出: .claude/spec/<feature>/SPEC.md                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLANNER AGENT                               │
│                    实施计划与风险评估                              │
│                                                                  │
│  输出: .claude/plan/<feature>.md                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TDD-GUIDE AGENT                              │
│                    测试用例与覆盖率策略                             │
│                                                                  │
│  输出: .claude/spec/<feature>/tests/*.test.ts                 │
│  Gate: RED phase verified                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOP AGENT                               │
│                     增量式代码实现                                │
│                                                                  │
│  输出: src/**/*.ts (或其他语言文件)                               │
│  Gate: GREEN + 80% coverage                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REVIEW LOOP (最多循环 3 次)                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │code-reviewer │───▶│ fix-agent    │───▶│ re-review   │       │
│  │   (问题)      │    │   (修复)      │    │   (验证)     │       │
│  └──────────────┘    └──────────────┘    └──────┬──────┘       │
│       │                    │                    │              │
│       └────────────────────┴────────────────────┘              │
│                      (如果发现问题)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TEST AGENT                                 │
│                     完整测试套件执行                              │
│                                                                  │
│  运行: npm test && npm run test:coverage                        │
│  Gate: 所有测试通过 + 80%+ 覆盖率                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LINT AGENT                                 │
│                     代码质量与风格检查                            │
│                                                                  │
│  运行: npm run lint                                              │
│  Gate: 无 lint 错误                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GIT AGENT (prp-pr)                            │
│                      提交、推送与 PR 创建                          │
│                                                                  │
│  输出: PR created with full context                              │
└─────────────────────────────────────────────────────────────────┘
```

## 工作流类型

### Feature Development (标准)
```
输入: "Add user authentication with OAuth"
流程: spec → planner → tdd → develop → review → test → lint → pr
```

### Bug Fix
```
输入: "Fix login button not working on mobile"
流程: spec (复现) → tdd (测试先行) → develop → review → test → lint → pr
```

### 仅 Code Review
```
输入: "Review the auth module"
流程: review → fix (可选) → re-review
```

### 空项目 / 最小化项目
```
输入: "New project with no test/lint tools"
流程: spec → planner → develop → review → pr

跳过: tdd (无 test runner), test (无 test framework), lint (无 linter)
```

## 工具检测

在启动工作流前，检测可用工具：

```bash
# 检测 test 工具
npm test &>/dev/null && echo "TEST_AVAILABLE" || echo "TEST_UNAVAILABLE"
npm run test:coverage &>/dev/null && echo "COVERAGE_AVAILABLE" || echo "COVERAGE_UNAVAILABLE"

# 检测 lint 工具
npm run lint &>/dev/null && echo "LINT_AVAILABLE" || echo "LINT_UNAVAILABLE"
npx eslint --version &>/dev/null && echo "ESLINT_AVAILABLE" || echo "ESLINT_UNAVAILABLE"
npx tsc --version &>/dev/null && echo "TYPESCRIPT_AVAILABLE" || echo "TYPESCRIPT_UNAVAILABLE"
```

## 基于工具检测的流程选择

| Test | Lint | 使用的流程 |
|------|------|-----------|
| Yes | Yes | `feature` (完整) |
| Yes | No | `feature-notlint` (跳过 lint) |
| No | Yes | `feature-notest` (跳过 test/tdd) |
| No | No | `minimal` (develop → review → pr) |

### 流程: `feature-notlint`
```
spec → planner → tdd → develop → review → test → pr
                                                 ↑
                                           Lint 跳过
```

### 流程: `feature-notest`
```
spec → planner → develop → review → lint → pr
                                     ↑
                        TDD/Test 跳过，测试文件仍会生成但不运行
```

### 流程: `minimal` (空项目)
```
spec → planner → develop → review → pr

无 test runner，无 linter，无 TDD
仅通过 code review 控制质量
```

## Agent 交接协议

每个 agent 输出标准化的交接文档：

```markdown
## Agent: [名称]
**状态:** COMPLETE | BLOCKED | ERROR
**输出:** [生成的文件/产物]
**下一个 Agent:** [谁应该运行]
**阻塞原因:** [如果有的话]
```

## 进度追踪

工作流状态保存在 `.claude/workflow-state.json`：

```json
{
  "workflowId": "feat-123",
  "type": "feature",
  "status": "in_progress",
  "currentPhase": "develop",
  "completedPhases": ["spec", "planner", "tdd"],
  "artifacts": {
    "spec": ".claude/spec/feature/SPEC.md",
    "plan": ".claude/plan/feature.md",
    "tests": ".claude/spec/feature/tests/"
  },
  "iterationCount": {
    "reviewLoop": 0
  },
  "startedAt": "2024-01-01T00:00:00Z"
}
```

## 错误处理

### Agent 执行失败
- 记录错误到 `.claude/workflow-state.json`
- 向用户报告错误详情
- 提供重试或跳过选项

### 测试失败
- 进入修复循环: `fix-agent → re-review`
- 最多 3 次迭代后请求人工介入

### 覆盖率失败
- 报告未覆盖的文件/行
- 返回 develop agent 添加更多测试

## Feedback Loop 追踪

工作流追踪所有 agent 之间的 feedback loops，确保透明性和质量控制。

### Feedback Loop 类型

| Loop | From | To | 触发条件 |
|------|------|----|----------|
| Review Loop | code-reviewer | fix-agent | 代码审查发现问题 |
| Test Feedback | test-agent | fix-agent | 测试失败或覆盖率低于阈值 |
| Lint Feedback | lint-agent | fix-agent | Lint 错误被检测到 |

### Feedback Loop 通知

**触发时 (发现问题):**
```
🔄 [10:30:15] Review Loop triggered! Returning to fix-agent.
   Reason: issues_found
   Iteration: 2/3
   Issues: 3 HIGH, 1 MEDIUM
```

**绕过时 (无问题):**
```
✓ [10:30:15] Review Loop passed smoothly - no feedback loop needed.
```

### 状态追踪

Feedback loop 历史保存在工作流状态中:
```json
{
  "iterationCount": {
    "reviewLoop": 2,
    "fixLoop": 2
  },
  "feedbackLoopHistory": [
    {
      "type": "review",
      "name": "Review Loop",
      "timestamp": "2026-04-03T10:30:15Z",
      "reason": "issues_found",
      "iteration": 1,
      "issuesFound": ["Security: hardcoded API key", "Error: missing try-catch"]
    }
  ]
}
```

### 最大迭代次数
- 每个 feedback loop 最多 3 次迭代
- 如果达到最大值，工作流阻塞并请求人工介入
- 使用 `isMaxIterationsReached(state, 'review')` 检查

### 带 Feedback 的显示
使用 `getStatusDisplayWithFeedback(state)` 而不是 `getStatusDisplay(state)` 可以看到:
- 当前 feedback loop 迭代次数
- 所有 loops 触发/绕过的摘要

## 命令语法

```
/feature-flow [type] [description]

类型:
  feature [description]      - 完整功能开发 (默认)
  feature-notlint [desc]     - 无 lint 阶段的功能
  feature-notest [desc]      - 无 test/tdd 阶段的功能
  minimal [description]      - 空项目 (无 test/lint)
  bugfix [description]       - Bug 修复工作流
  hotfix [description]       - 紧急生产修复
  refactor [description]     - 代码重构

自动检测:
  如果未指定类型，将检测工具并建议合适的流程

示例:
  /feature-flow Add user profile page
  /feature-flow bugfix Fix cart calculation error
  /feature-flow hotfix Login timeout in production
  /feature-flow minimal Initialize new microservice
```

## 交互模式

如果没有提供参数，进入交互模式：

1. **选择工作流类型** (feature/bugfix/hotfix/refactor)
2. **描述需求** (多轮对话)
3. **确认并开始** (用户确认后再执行)

## 状态显示

工作流执行期间显示：

```
┌─────────────────────────────────────────────────────────────┐
│ Feature Flow: [功能名称]                                     │
├─────────────────────────────────────────────────────────────┤
│ Phase: DEVELOP                                             │
│ Progress: ████████░░░░░░░░░░░ 40%                         │
│                                                             │
│ ✓ spec        [  COMPLETE  ]  需求已编写                     │
│ ✓ planner     [  COMPLETE  ]  计划已批准                     │
│ ✓ tdd         [  COMPLETE  ]  12 tests RED                 │
│ ● develop     [ IN PROGRESS]  正在实现...                   │
│ ○ review      [  PENDING   ]  等待 develop                  │
│ ○ test        [  PENDING   ]  等待 review                   │
│ ○ lint        [  PENDING   ]  等待 test                     │
│ ○ pr          [  PENDING   ]  等待 lint                     │
└─────────────────────────────────────────────────────────────┘
```

## 相关

- `agents/spec.md` - 需求分析
- `agents/planner.md` - 实施计划
- `agents/tdd-guide.md` - 测试驱动开发
- `agents/develop.md` - 代码实现
- `agents/code-reviewer.md` - 代码审查
- `agents/fix-agent.md` - 修复 review/test/lint 反馈的问题
- `agents/test-agent.md` - 测试执行 (带 feedback loop 追踪)
- `agents/lint-agent.md` - Lint 检查 (带 feedback loop 追踪)
- `commands/prp-pr.md` - PR 创建
