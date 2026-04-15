# Feedback Curator Agent 设计文档

> **状态**：已实现
> **日期**：2026-04-15

## 目标

新增一个 `feedback-curator` agent，用于消费各角色交接文档中的 `Feedback Record`，维护反馈记忆文件，并生成面向用户的决策摘要。

## 背景

当前 `dev-workflow` 已要求 Reviewer 和 Tester 输出结构化 `Feedback Record`，并要求主 agent 在阻塞型反馈时立即询问用户、在非阻塞建议时于任务收尾统一询问用户。

但现阶段仍存在两个缺口：

- 反馈记录动作依赖主 agent 手工完成，容易漏写或格式不一致
- 是否升级为 `prevents-recurrence` 缺乏专门角色负责整理和提名

本设计通过引入 `feedback-curator`，把“记录、归档、提名、汇总”从主流程里抽离出来，保持 harness engineering 所需的可追踪性和职责边界。

## 设计原则

1. **记录与执行分离**：`feedback-curator` 可以整理和写入 memory，但不能直接推动代码修改
2. **主流程不断裂**：阻塞反馈和非阻塞建议都要被记录，但用户决策仍由主 agent 发起
3. **最小增量接入**：优先接入现有 `dev-workflow`，不重写整个流程
4. **规范升级可审计**：`prevents-recurrence` 仅由 curator 提名，真正改规范仍由主 agent 在用户批准后协调 Architect 执行

## 角色定义

### Feedback Curator

**职责**：

- 读取交接文档中的 `Feedback Record`
- 维护 `docs/memory/feedback/agent-feedback.md`
- 判断是否需要提名到 `docs/memory/feedback/prevents-recurrence.md`
- 生成给用户的反馈决策摘要

**明确不负责**：

- 不直接修改业务代码
- 不直接修改 `AGENTS.md`、Skill 或 Agent 定义
- 不替代主 agent 询问用户
- 不覆盖 Reviewer / Tester 的专业判断

## 触发规则

### 运行时触发

`feedback-curator` 在以下场景运行：

1. **交接后触发**：当 Reviewer 或 Tester 的交接文档包含 `Feedback Record` 时立即触发
2. **交付前触发**：当前任务准备交付前再运行一次，用于汇总尚未向用户统一询问的非阻塞建议

### 输出要求

每次运行都需要完成以下工作：

1. 判断本次是否存在有效 `Feedback Record`
2. 如果存在，则按规范写入或更新 `agent-feedback.md`
3. 如果 `prevents_recurrence: true` 或疑似重复问题，则检查是否应提名到 `prevents-recurrence.md`
4. 输出一份交接摘要给主 agent，说明：
   - 新增了哪些反馈记录
   - 哪些属于阻塞项
   - 哪些适合在任务收尾统一询问
   - 是否建议升级为 recurrence 条目

## 与现有流程的衔接

### Dev Workflow 集成

更新后的主流程如下：

```text
Dev
  ↓
Reviewer / Tester 产出交接文档
  ↓
feedback-curator 读取 Feedback Record
  ↓
写入 agent-feedback.md / 提名 recurrence
  ↓
主 agent 根据 curator 摘要决定：
  - 阻塞项：立即询问用户
  - 非阻塞项：继续流程，收尾统一询问
```

### 与 Architect 的关系

- `feedback-curator` 只做“提名”
- 当用户批准将某类问题升级为系统约束时，由主 agent 协调 `architect` 修改 `AGENTS.md`、专题规范或 Agent 定义

## 数据写入规则

### `docs/memory/feedback/agent-feedback.md`

`feedback-curator` 负责：

- 分配新的 `af-YYYYMMDD-NNN` 编号
- 填写 `source`、`type`、`content`、`suggestion`、`ask_user`、`prevents_recurrence`
- 将待确认项写入“待询问用户的反馈”
- 将已确认或已拒绝项保留在“已处理反馈”

### `docs/memory/feedback/prevents-recurrence.md`

`feedback-curator` 不直接落地正式规范，但可以：

- 统计同类问题出现次数
- 新增或更新 recurrence 提名条目
- 在条目中明确“建议同步位置”

是否把提名升级为正式规范修改，仍取决于用户确认和 Architect 后续执行。

## 交接文档格式

`feedback-curator` 完成后输出如下报告给主 agent：

```markdown
## 交接：Feedback Curator → 主 agent

### 输入来源
- [本次读取的交接文档]

### 新增记录
- af-YYYYMMDD-NNN：...

### 用户决策建议
- 阻塞项：...
- 可收尾统一询问项：...

### Recurrence 提名
- [新增/更新/无]

### 状态
APPROVED / BLOCKED
```

## 文件结构

```text
.claude/agents/
  feedback-curator.md

docs/design-docs/
  2026-04-15-feedback-curator-agent-design.md

docs/memory/feedback/
  agent-feedback.md
  prevents-recurrence.md

skills/dev-workflow/
  SKILL.md   # 增加 curator 的触发与接入说明
```

## 风险与约束

### 风险

- 如果交接文档中的 `Feedback Record` 不完整，curator 可能无法稳定归档
- 如果主 agent 未调用 curator，流程仍可能退回手工记录
- 如果 recurrence 判定标准过松，`prevents-recurrence.md` 会变成噪音堆积

### 缓解

- 在 Reviewer / Tester 文档中继续强调 `Feedback Record` 的结构化输出
- 在 `dev-workflow` 中写明 curator 的触发点
- 先让 curator 只做“提名”，不自动改规范

## 实施范围

本次实现应包含：

1. 新增 `feedback-curator` agent 定义
2. 更新 `dev-workflow`，纳入 curator 的触发和职责
3. 更新相关产品规格和设计文档
4. 必要时补充 feedback memory 文件的写入约定

本次实现不包含：

1. 自动修改业务代码
2. 自动修改 `AGENTS.md` 或其他规范文件
3. 新增复杂的状态数据库或脚本化流水线
