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

**适用场景**：单一任务、边界清楚、工具数量有限、不需要独立 reviewer 角色或并行审查

**执行方式**：主 agent 以单 agent workflow 的方式串行执行固定阶段，而不是调用 subagent。Skill 模式必须显式产出结构化阶段记录，并在必要时升级到 `Subagent` 或 `Team` 模式；用户只在最终交付时统一确认。

#### Skill 模式状态机

```text
Input Ready
  ↓
Plan Check
  ↓
Execute
  ↓
Self Review
  ↓
Verify
  ↓
Doc Sync
  ↓
Final Summary
  ↓
Done
```

#### Skill 模式阶段说明

| 阶段 | 目标 | 最小输出 |
|------|------|---------|
| Input Ready | 确认需求、计划、memory 输入完整 | 输入是否齐备；是否可继续 |
| Plan Check | 进行最小 Architect 检查，判断是否适合继续停留在 Skill 模式 | `Mode Decision` |
| Execute | 实现代码或文档变更 | `Execution` |
| Self Review | 用显式 checklist 进行单 agent 自检 | `Self Review` + `Feedback Record` |
| Verify | 探测并执行最合适的验证入口 | `Verification` |
| Doc Sync | 检查并更新受影响文档 | `Doc Sync` |
| Final Summary | 汇总结果、风险、未执行建议、模式升级建议 | `Final Summary` |

#### Skill 模式最小产物

Skill 模式不要求生成多角色 handoff 文档，但必须至少在交付前整理一份 `Skill Workflow Record`：

```markdown
## Skill Workflow Record

### Context
- plan_path:
- task_scope:
- mode: skill

### Mode Decision
- fit_for_skill_mode:
- escalation_reason:

### Execution
- files_touched:
- commands_run:
- artifacts:

### Self Review
- checklist:
- issues_found:
- feedback_record:

### Verification
- detected_entrypoints:
- executed_checks:
- assumptions:
- uncovered_risks:

### Doc Sync
- docs_checked:
- docs_updated:

### Final Summary
- outcome:
- remaining_risks:
- followups:
```

这个记录用于：

- 支撑 `/compact` 或新会话后的恢复
- 为 memory / feedback 提供事实来源
- 让 Skill 模式也具备审计性，而不是只依赖隐式上下文

#### Skill 模式中的反馈处理

- **阻塞反馈来源**：自检发现严重问题、验证失败、文档同步发现规范冲突
- **记录要求**：阻塞与非阻塞反馈都必须先进入 `Feedback Record`
- **自动修复条件**：仅当 `risk_level=low` 且 `action_type` 属于自动执行白名单时，允许在 Skill 模式内自动修复并继续
- **升级条件**：一旦反馈表明任务已需要独立 reviewer、重复循环或更强状态追踪，立即升级到 `Subagent 模式`

#### 模式升级规则

- **Skill → Subagent**
  - 出现循环审查需求
  - 出现 2 轮以上反馈回流
  - 需要独立 reviewer / tester 视角
  - 任务跨度或风险已超出单 agent 串行 workflow 的可控范围
- **Subagent → Team**
  - 需要多视角并行审查
  - 需要并行验证不同风险面
- **禁止继续停留在 Skill 模式**
  - 高风险不可逆操作
  - 复杂 tool orchestration
  - 强状态追踪需求
  - 需要明确 gatekeeper 角色

#### Skill 模式内部子 Skill

Skill 模式后续建议引入少量阶段型专用 Skill，用于稳定单 agent workflow 的关键阶段，而不是按角色镜像拆分更多 Skill。

当前建议的第一批是：

- `plan-check-skill`
- `self-review-skill`
- `verification-skill`

详细契约见：

- [references/skill-mode-specialized-skills.md](references/skill-mode-specialized-skills.md)
- [internal-skills/plan-check-skill/SKILL.md](internal-skills/plan-check-skill/SKILL.md)
- [internal-skills/self-review-skill/SKILL.md](internal-skills/self-review-skill/SKILL.md)
- [internal-skills/verification-skill/SKILL.md](internal-skills/verification-skill/SKILL.md)

这些子 Skill 初期应作为 `dev-workflow` 的内部子 skill 使用，不急于暴露成用户直接调用的顶层入口。

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

## 模式选择建议

| 模式 | 核心特征 | 何时使用 |
|------|---------|---------|
| Skill | 单 agent 显式 workflow | 任务短、边界清楚、无需独立 reviewer |
| Subagent | 多角色串行 handoff | 需要 reviewer / tester 门禁和状态追踪 |
| Team | 并行多视角审查 | 需要多个 reviewer 并行给结论 |

## 交接文档

每个角色完成后必须写交接文档，格式见下方统一格式。
交接文档用于主 agent 读取结果、决定下一步操作。
开始执行前，主 agent 应先读取 `docs/memory/index.md` 和 `docs/memory/feedback/prevents-recurrence.md`。

Skill 模式不要求多角色 handoff，但仍必须产出上文的 `Skill Workflow Record`。`Subagent` / `Team` 模式则继续使用本节交接文档格式。

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
- "用 Skill 模式完成这次小范围文档更新"
- "帮我用 developer 实现这个功能"
- "启动完整流程：dev → reviewer → tester"
- "开 3 个 reviewer 并行审查这段代码"

主 agent 根据复杂度决定使用 Skill / Subagent / Team 中的哪一种模式；如果选择后发现复杂度超出当前模式边界，应显式升级。

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
3. **状态追踪**：交接文档与 `Skill Workflow Record` 持久化到 git
