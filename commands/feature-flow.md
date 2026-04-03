---
description: 启动自动化功能开发工作流：spec → planner → tdd → develop → review → test → lint → pr。支持 feature/bugfix/hotfix/refactor 类型。
---

# 功能流命令

启动完整的功能开发流程，实现智能 Agent 编排。

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

### 功能开发
```
/feature-flow 添加用户OAuth2认证
```
**流程：** spec → planner → tdd → develop → review → test → lint → pr

### Bug 修复
```
/feature-flow bugfix 修复移动端购物车计算错误
```
**流程：** spec (复现) → tdd (测试优先) → develop → review → test → lint → pr

### 热修复
```
/feature-flow hotfix 生产环境登录超时
```
**流程：** spec (紧急) → develop → review → test → lint → pr (跳过规划)

### 重构
```
/feature-flow refactor 抽取支付处理为独立服务
```
**流程：** planner → develop → review → test → lint → pr

## 交互模式

当无参数调用时，进入交互模式：

```markdown
## 功能流 - 交互模式

选择工作流类型：

1. [feature]  - 新功能开发
2. [bugfix]   - Bug 修复，采用测试优先方式
3. [hotfix]   - 紧急生产环境修复
4. [refactor] - 代码重构

请输入选择 (1-4)：
```

## 上下文流转

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户请求                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  spec (需求分析)                                                │
│  - 澄清模糊需求                                                  │
│  - 生成用户故事                                                  │
│  - 输出：.claude/spec/<feature>/SPEC.md                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  planner (规划)                                                  │
│  - 分析依赖                                                      │
│  - 制定实施计划                                                  │
│  - 识别风险                                                      │
│  - 输出：.claude/plans/<feature>.md                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  tdd-guide (测试驱动开发)                                        │
│  - 先编写测试                                                    │
│  - 定义验收标准                                                  │
│  - 输出：.claude/spec/<feature>/tests/                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  develop (代码实现)                                              │
│  - TDD 循环 (RED → GREEN → REFACTOR)                            │
│  - 80%+ 测试覆盖率                                               │
│  - 输出：src/ 目录变更                                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  code-reviewer (代码审查)                                        │
│  - 代码质量检查                                                  │
│  - 安全审查                                                      │
│  - 输出：审查报告                                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  test (测试)                                                     │
│  - 单元测试                                                      │
│  - 集成测试                                                      │
│  - E2E 测试                                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  lint (代码检查)                                                 │
│  - 格式检查                                                      │
│  - 风格检查                                                      │
│  - 静态分析                                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Handoff 文档
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  pr (Pull Request)                                              │
│  - 创建 PR                                                      │
│  - 包含测试结果                                                  │
│  - 包含覆盖率报告                                                │
└─────────────────────────────────────────────────────────────────┘
```

## 交接文档格式

在每个阶段之间，创建结构化交接文档：

```markdown
## 交接：[前一阶段] → [下一阶段]

### 背景
[已完成工作的总结]

### 关键发现
[关键发现或决定]

### 已修改的文件
[已触及的文件列表]

### 待解决的问题
[留给下一阶段的未决事项]

### 建议
[建议的后续步骤]
```

### 阶段交接示例

```markdown
## 交接：spec → planner

### 背景
已完成功能需求分析和用户故事编写。

### 关键发现
- 需要集成第三方支付 API
- 现有数据库 schema 需要扩展

### 已修改的文件
- .claude/spec/payment/SPEC.md

### 待解决的问题
- 支付 API 限流策略
- 事务回滚机制

### 建议
下一阶段应与支付团队确认 API 稳定性。
```

## 工作流状态

状态持久化到 `.claude/workflow-state.json`：

```json
{
  "currentPhase": "develop",
  "completedPhases": ["spec", "planner", "tdd"],
  "iterationCounts": {
    "develop": 3
  },
  "artifacts": {
    "spec": ".claude/spec/payment/SPEC.md",
    "plan": ".claude/plans/payment.md",
    "tests": ".claude/spec/payment/tests/"
  }
}
```

### 状态字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `currentPhase` | string | 当前阶段 |
| `completedPhases` | string[] | 已完成阶段列表 |
| `iterationCounts` | object | 各阶段迭代次数 |
| `artifacts` | object | 阶段产物路径 |

## 最终报告格式

工作流完成后，生成最终报告：

```markdown
# 功能流报告
====================
工作流：功能
任务：[描述]
阶段：spec → planner → tdd → develop → review → test → lint → pr

概要
-------
[一段总结]

阶段输出
-------------
spec：[总结]
planner：[总结]
tdd：[总结]
develop：[总结]
review：[总结]
test：[总结]
lint：[总结]

已更改文件
-------------
[列出所有修改的文件]

测试结果
------------
- 单元测试：X 通过，Y 失败
- 集成测试：X 通过，Y 失败
- E2E 测试：X 通过，Y 失败

覆盖率
-----------
[覆盖率报告摘要]

代码审查
---------------
[审查发现和建议]

最终状态
--------------
[可发布 / 需要改进 / 已阻止]
```

## 各阶段产物

| 阶段 | 产物路径 | 说明 |
|------|----------|------|
| spec | `.claude/spec/<feature>/SPEC.md` | 需求规格文档 |
| planner | `.claude/plans/<feature>.md` | 实施计划 |
| tdd | `.claude/spec/<feature>/tests/` | 测试文件 |
| develop | `src/` | 源代码变更 |
| review | `.claude/reviews/<feature>.md` | 审查报告 |
| test | `coverage/` | 测试覆盖率报告 |
| lint | `lint-report/` | 代码检查报告 |

## 热修复特殊处理

热修复跳过 `planner` 和 `tdd` 阶段：

```
spec (紧急) → develop → review → test → lint → pr
```

交接文档需标注 **紧急** 标记：

```markdown
## 交接：spec → develop [热修复/紧急]

### 背景
生产环境紧急问题，需要立即修复。

### 影响范围
[问题影响说明]

### 已修改的文件
[文件列表]
```

## 重构特殊处理

重构跳过 `spec` 和 `tdd` 阶段：

```
planner → develop → review → test → lint → pr
```

## 示例

```markdown
# 新功能
/feature-flow 添加实时通知功能

# Bug 修复
/feature-flow bugfix 搜索在查询为空时返回错误结果

# 热修复
/feature-flow hotfix 支付网关超时

# 重构
/feature-flow refactor 迁移到仓储模式
```

## 前置要求

- 已初始化 Git 仓库
- Node.js >=18 (用于钩子脚本)
- 已配置 npm/pnpm/yarn

## 相关技能

- `skill: feature-development-workflow` - 完整工作流文档
- `skill: tdd-workflow` - 测试驱动开发指南
- `skill: git-workflow` - Git 最佳实践
- `/orchestrate` - 多 Agent 工作流编排指南
