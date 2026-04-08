---
description: 启动自动化功能开发工作流。通过 prompt 约束实现文档流转、进度追踪和状态管理。
---

# 功能流命令

启动完整的功能开发流程，通过 Handoff 文档和状态约定实现 Agent 协作。

## 用法

```
/feature-flow [类型] [描述]
/feature-flow                    # 交互模式
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `类型` | `feature` \| `bugfix` \| `hotfix` \| `refactor` | 工作流类型 |
| `描述` | string | 功能或修复描述 |

## 工作流类型

| 类型 | 说明 | 流程 |
|------|------|------|
| `feature` | 完整功能开发 | spec → planner → tdd → develop → quality-gate → pr |
| `bugfix` | Bug 修复 | spec → tdd → develop → quality-gate → pr |
| `hotfix` | 紧急修复 | spec → develop → quality-gate → pr |
| `refactor` | 重构 | planner → develop → quality-gate → pr |

## 质量门

`quality-gate` skill 统一管理代码质量验证：

- **review** — code-reviewer 执行代码审查
- **test** — test-agent 运行测试并验证覆盖率
- **lint** — lint-agent 检查代码风格

质量门内部自动执行 `verify → fix → verify` 循环，循环次数由配置文件控制（默认 3 次）。

详见 `skills/quality-gate/SKILL.md` 和 `skills/quality-gate/loop-state.md`。

## 状态管理

状态保存在 `.claude/workflow-state.md`（纯 Markdown），每个阶段由当前 Agent 负责更新。

### 状态文件格式

```markdown
# Workflow State

## 基本信息
- **Workflow ID**: feature-xxx
- **类型**: feature
- **描述**: 添加用户认证
- **状态**: in_progress | completed | blocked
- **开始时间**: 2026-04-03T10:00:00Z

## 阶段进度
| 阶段 | 状态 | 完成时间 |
|------|------|----------|
| spec | ✓ COMPLETE | 2026-04-03T10:05:00Z |
| planner | ✓ COMPLETE | 2026-04-03T10:10:00Z |
| tdd | ● IN_PROGRESS | - |
| develop | ○ PENDING | - |
| quality-gate | ○ PENDING | - |
| pr | ○ PENDING | - |

## Quality Gates
| Gate | 状态 | 迭代 | 结果 |
|------|------|------|------|
| review | ○ PENDING | 0/3 | - |
| test | ○ PENDING | 0/3 | - |
| lint | ○ PENDING | 0/3 | - |

## 产物路径
- spec: .claude/spec/user-auth/SPEC.md
- plan: .claude/plan/user-auth.md
- tests: .claude/spec/user-auth/tests/
- changes: src/

## 当前阶段
### spec → planner

### 待解决问题
- [ ] 第三方 API 限流策略需确认
- [ ] 支付回滚机制未定义

### 建议
下一阶段应与支付团队确认 API 稳定性。
```

## Agent 职责约定

### 状态更新规则

**进入阶段时：**
1. 读取 `.claude/workflow-state.md`
2. 更新 `当前阶段` 为自己的阶段
3. 更新阶段状态为 `● IN_PROGRESS`

**完成阶段时：**
1. 更新阶段状态为 `✓ COMPLETE`
2. 记录完成时间
3. 在 Handoff 区域填写交接信息
4. 将状态更新追加到文件末尾

### 状态标识含义

| 标识 | 含义 |
|------|------|
| ✓ | 已完成 |
| ● | 进行中 |
| ○ | 等待中 |

## Handoff 文档格式

每个阶段完成后，生成 Handoff 文档传递给下一 Agent：

```markdown
## Handoff: [当前阶段] → [下一阶段]

### 背景
[已完成工作的总结]

### 关键发现
[1-3 个关键决定或发现]

### 产物路径
- [文件路径]: [说明]

### 待解决问题
- [ ] [问题 1]
- [ ] [问题 2]

### 建议
[下一个 Agent 应该注意什么]
```

## 进度展示

Agent 在执行过程中应输出进度：

```
┌─────────────────────────────────────────────────────────────┐
│ Feature Flow: 添加用户认证                                   │
├─────────────────────────────────────────────────────────────┤
│ Phase: DEVELOP                                             │
│ Progress: ████████░░░░░░░░░░░░░░░░░░░░░░ 40%              │
│                                                             │
│ ✓ spec        [ COMPLETE  ]  需求已编写                     │
│ ✓ planner     [ COMPLETE  ]  计划已批准                     │
│ ● develop     [ IN PROGRESS]  正在实现...                   │
│ ○ quality-gate[  PENDING   ]  等待 develop                  │
│ ○ pr          [  PENDING   ]  等待 quality-gate              │
└─────────────────────────────────────────────────────────────┘
```

## 阶段产物约定

| 阶段 | 产物路径 | 说明 |
|------|----------|------|
| spec | `.claude/spec/<feature>/SPEC.md` | 需求规格文档 |
| planner | `.claude/plan/<feature>.md` | 实施计划 |
| tdd | `.claude/spec/<feature>/tests/*.test.ts` | 测试文件 |
| develop | `src/` | 源代码变更 |
| quality-gate | `.claude/workflow-state.md` | 质量门状态记录 |
| pr | Git PR | Pull Request |

## 自定义工作流

用户可通过 YAML 配置文件自定义工作流行为：

```yaml
# 复制到 .claude/workflow-config.yaml
qualityGates:
  review:
    maxIterations: 5       # 更多修复尝试
  test:
    coverageThreshold: 90  # 更高覆盖率要求
```

详见 `examples/workflow-config.yaml`。

## 示例

```markdown
# 新功能
/feature-flow 添加实时通知功能

# Bug 修复
/feature-flow bugfix 搜索结果为空时返回错误

# 热修复
/feature-flow hotfix 支付网关超时

# 重构
/feature-flow refactor 迁移到仓储模式
```

## 前置要求

- 已初始化 Git 仓库
- Claude Code 环境
- npm/pnpm/yarn（用于 test/lint 命令）

## 相关

- `skill: feature-development-workflow` - 完整流程定义
- `skill: quality-gate` - 质量门定义
- `skill: quality-gate/loop-state.md` - 循环状态格式
- `agents/spec.md` - Spec Agent
- `agents/develop.md` - Develop Agent
- `agents/code-reviewer.md` - Code Reviewer
