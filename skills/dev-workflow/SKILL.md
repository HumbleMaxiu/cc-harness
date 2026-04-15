---
name: dev-workflow
description: 开发流程 agent 系统。包含 A/Dev/R/T 四种角色，支持 Skill/Subagent/Team 三种模式。接在 writing-plans 之后。
---

# Dev Workflow Agent System

开发流程 agent 系统，遵循 harness engineering 原则。
接在 `writing-plans` 技能之后使用。

## 入口规则

- 创造性任务先经过 `brainstorming` / `writing-plans`，再进入实现
- 主 agent 开始执行前先读取 `docs/memory/index.md` 和 `docs/memory/feedback/prevents-recurrence.md`
- 没有可接受的设计输入时，不直接进入 Developer 实现

## 角色

| 角色 | Agent | 职责 |
|------|-------|------|
| 架构师 | architect | 任务开始前检查计划，开发完成后维护文档 |
| 开发者 | developer | TDD 实现功能 |
| 审查者 | reviewer | 代码审查，质量把关 |
| 测试工程师 | tester | 测试验证 |
| 反馈整理员 | feedback-curator | 整理 `Feedback Record`，维护 feedback memory，输出自动处理轨迹与最终汇总摘要 |

## 三种开发模式

### Skill 模式

**适用场景**：单一任务、步骤明确、不需要循环审查

**执行方式**：主 agent 直接执行各阶段，并在阻塞反馈出现时自动回流修复；用户只在最终交付时统一确认

### Subagent 模式

**适用场景**：需要循环审查、有状态追踪需求

**执行方式**：
1. 主 agent 读取 `.claude/agents/` 中的 agent 定义
2. 用自然语言传递上下文给 subagent
3. Subagent 完成后主 agent 读取结果，决定下一步
4. 每个角色完成后写交接文档
5. 如交接文档包含 `Feedback Record`，主 agent 应触发 `feedback-curator` 维护 `docs/memory/feedback/agent-feedback.md`
6. 阻塞型反馈先按风险分级，再决定自动修复回流还是保留到最终确认；非阻塞建议可在最终交付前统一向用户汇总

### Team 模式

**适用场景**：需要多角度并行审查

**执行方式**：
1. 主 agent 创建 Agent Team
2. 多个 Reviewer 并行审查同一份代码
3. 结果汇总给主 agent

## Subagent 模式调用流程

### 单任务循环

```
主 agent
    ↓
Architect 检查计划文档
    ↓
Dev 实现
    ↓
Reviewer 审查
    ↓
Feedback Curator 记录反馈并输出摘要
    ↓ [REJECTED]
自动回流修复
Dev 实现
    ↓ [APPROVED]
Tester 测试
    ↓
Feedback Curator 记录反馈并输出摘要
    ↓ [REJECTED]
自动回流修复
Dev 实现
    ↓
[通过] → Architect 维护文档
    ↓
交付
```

### 循环定义

| 循环 | 条件 | 动作 |
|------|------|------|
| Dev → Reviewer | REJECTED + low risk | `feedback-curator` 记录阻塞反馈，主 agent 自动回到实现修复并继续循环 |
| Dev → Reviewer | REJECTED + medium/high risk | `feedback-curator` 记录阻塞反馈，主 agent 停止自动修改，把风险保留到最终确认或显式 gate |
| Dev → Reviewer | APPROVED | 进入 Tester |
| Tester | REJECTED + low risk | `feedback-curator` 记录阻塞反馈，主 agent 自动回到实现修复并继续循环 |
| Tester | REJECTED + medium/high risk | `feedback-curator` 记录阻塞反馈，主 agent 停止自动修改，把风险保留到最终确认或显式 gate |
| Tester | APPROVED | 进入 Architect 维护 |

**终止条件**：Reviewer APPROVED + Tester APPROVED

### 并行审查

- 可临时起意开启多个 Reviewer 并行审查同一份代码
- 结果汇总给主 agent

## Team 模式调用流程

```
主 agent
    ↓
创建 Agent Team
    ↓
多个 Reviewer 并行审查
    ↓
结果汇总
    ↓
后续流程同 Subagent 模式
```

## 交接文档

每个角色完成后必须写交接文档，格式见下方统一格式。
交接文档用于主 agent 读取结果、决定下一步操作。
开始执行前，主 agent 应先读取 `docs/memory/index.md` 和 `docs/memory/feedback/prevents-recurrence.md`。

## 反馈决策规则

- **阻塞型反馈**：Reviewer 或 Tester 给出 `REJECTED` 时，主 agent 必须先触发 `feedback-curator` 记录到 `docs/memory/feedback/agent-feedback.md`。只有 `risk_level=low` 且 `action_type` 属于自动执行白名单时，才自动回到实现修复后继续主流程。
- **自动执行白名单**：`code_fix`、`test_fix`、`doc_sync` 且 `scope=local_file` 或 `scope=cross_module` 但无外部副作用。
- **自动执行黑名单**：`workflow_rule`、`repo_rule`、`external`、删除文件、迁移脚本、发布/部署、权限或网络相关变更。
- **非阻塞反馈**：Reviewer 或 Tester 在 `APPROVED` 状态下给出的改进建议，也应先由 `feedback-curator` 记录；主流程可以继续，但在最终交付前统一向用户汇总。
- **最终确认**：用户只在最终交付时统一确认产物、验证结果、剩余风险和未自动执行建议。
- **同类问题累计 2 次或以上**：除记录反馈外，`feedback-curator` 还应更新 `docs/memory/feedback/prevents-recurrence.md` 中的提名或统计，并在最终交付摘要中提示主 agent 评估是否升级规范。
- **抽象要求**：`Feedback Record` 记录的是抽象后的问题模式和规则；原始 lint / test / review 输出留在角色专项输出和 `evidence` 中，不直接进入长期 memory。

## Tester 运行时验证规则

- Tester 必须先探测项目技术栈和可用验证入口，再建立测试矩阵
- Tester 不得把“项目缺少统一脚本”当作跳过验证的理由
- 当存在多个候选命令时，Tester 选择最项目原生、最贴近本轮变更范围的命令，并在交接文档中说明
- 当无法可靠判断可执行命令时，Tester 必须把已探测到的事实汇总给用户，请用户确认
- Tester 输出必须同时覆盖：已执行验证、环境假设、未覆盖风险

## Feedback Curator 接入点

- **交接后触发**：Reviewer 或 Tester 的交接文档中包含有效 `Feedback Record` 时立即触发 `feedback-curator`
- **交付前触发**：当前任务准备交付前再次触发 `feedback-curator`，汇总自动处理轨迹、尚未执行的建议和剩余风险
- **职责边界**：`feedback-curator` 可以写 memory 文件，但不得直接修改业务代码、Skill、Agent 定义或 `AGENTS.md`

## 统一交接文档格式

```markdown
## 交接：[from] → [to]

### 任务上下文
- plan_path: ...
- task_id: ...
- step_scope: ...
- spec_refs: ...
- handoff_source: ...

### 完成内容
- files_touched: ...
- commands_run: ...
- artifacts: ...

### 结果
- status: APPROVED / REJECTED / BLOCKED
- blocking: true / false

### 角色专项输出
- ...

### Open Questions
- ...

### 建议
- ...

### Feedback Record
source: reviewer | tester | self-check | none
type: correction | improvement | issue | none
pattern: ...
rule: ...
action_type: code_fix | test_fix | doc_sync | workflow_rule | risk_note | none
risk_level: low | medium | high | none
scope: local_file | cross_module | repo_rule | external | none
content: ...
suggestion: ...
prevents_recurrence: true | false

### 状态
APPROVED / REJECTED / BLOCKED
```

当没有新增反馈时，`Feedback Record` 填写 `source: none`。
角色可在“角色专项输出”中扩展各自字段，但必须保留上述公共骨架，确保主 agent 和 `feedback-curator` 能稳定消费。

**单独调用时的行为**：

当 agent 独立使用时（不通过 workflow），交接文档作为报告格式输出给用户。

## 调用方式

用户通过自然语言描述需求：
- "帮我用 developer 实现这个功能"
- "启动完整流程：dev → reviewer → tester"
- "开 3 个 reviewer 并行审查这段代码"

主 agent 读取对应 agent 定义，用自然语言传递上下文。

## 计划完成处理

实施计划完成后：
- 将计划从 `docs/exec-plans/active/` 移动到 `docs/exec-plans/completed/`
- 在 git 中提交状态变更

## 与现有流程的衔接

```
用户需求
    ↓
brainstorming（如需）
    ↓
writing-plans → 实施计划 → dev-workflow
    ↓
交付
```

## 扩展点

1. **领域 Skill**：后续可加入 react-dev、vue-dev 等，Developer agent 调用
2. **Team 模式完善**：多角色并行协作
3. **状态追踪**：交接文档持久化到 git
