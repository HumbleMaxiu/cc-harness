---
name: feature-development-workflow
description: Complete feature development workflow orchestrating spec → tdd → develop → quality-gate → pr pipeline. Use when user requests a full feature implementation or /feature-flow command is invoked.
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
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOP AGENT                               │
│                     增量式代码实现                                │
│                                                                  │
│  输出: src/**/*.ts (或其他语言文件)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QUALITY GATE                                │
│              (由 skill: quality-gate 管理)                        │
│                                                                  │
│  类型: review → test → lint                                     │
│  循环: verify → fix → verify (内部自动处理)                      │
│  输出: PASS | FAIL | BLOCKED                                    │
│  状态: .claude/workflow-state.md                                │
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

## 质量门说明

质量门统一管理代码质量验证，详见 `skill: quality-gate`。

主工作流只需调用 skill，无需关心循环细节：

```
skill: quality-gate
type: review

skill: quality-gate
type: test

skill: quality-gate
type: lint
```

返回 `PASS` 时继续下一阶段，返回 `BLOCKED` 时等待人工介入。

## 工作流类型

### Feature Development (标准)
```
输入: "Add user authentication with OAuth"
流程: spec → planner → tdd → develop → quality-gate → pr
```

### Bug Fix
```
输入: "Fix login button not working on mobile"
流程: spec (复现) → tdd (测试先行) → develop → quality-gate → pr
```

### 仅 Code Review
```
输入: "Review the auth module"
流程: skill: quality-gate, type: review
```

### 空项目 / 最小化项目
```
输入: "New project with no test/lint tools"
流程: spec → planner → develop → quality-gate (仅 review) → pr

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

## Agent 交接协议

每个 agent 输出标准化的交接文档：

```markdown
## Agent: [名称]
**状态:** COMPLETE | BLOCKED | ERROR
**输出:** [生成的文件/产物]
**下一个 Agent:** [谁应该运行]
**阻塞原因:** [如果有的话]
```

## 错误处理

### Agent 执行失败
- 记录错误到 `.claude/workflow-state.md`
- 向用户报告错误详情
- 提供重试或跳过选项

### 质量门失败
- 详见 `skill: quality-gate`
- 达到最大迭代次数后返回 `BLOCKED`
- 等待人工介入或显式 override

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
│ ✓ tdd         [  COMPLETE  ]  12 tests                     │
│ ● develop     [ IN PROGRESS]  正在实现...                   │
│ ○ quality-gate[  PENDING   ]  等待 develop                  │
│ ○ pr          [  PENDING   ]  等待 quality-gate              │
└─────────────────────────────────────────────────────────────┘
```

## 相关

- `skill: quality-gate` - 质量门定义（review/test/lint 循环管理）
- `skills/quality-gate/loop-state.md` - 循环状态格式
- `agents/spec.md` - 需求分析
- `agents/planner.md` - 实施计划
- `agents/tdd-guide.md` - 测试驱动开发
- `agents/develop.md` - 代码实现
- `agents/code-reviewer.md` - 代码审查（quality-gate 调用）
- `agents/fix-agent.md` - 修复 agent（quality-gate 循环调用）
- `agents/test-agent.md` - 测试执行（quality-gate 调用）
- `agents/lint-agent.md` - Lint 检查（quality-gate 调用）
- `commands/prp-pr.md` - PR 创建
