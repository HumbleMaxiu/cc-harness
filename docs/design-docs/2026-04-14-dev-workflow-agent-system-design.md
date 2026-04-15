# Dev Workflow Agent System 设计文档

> **状态**：已批准
> **日期**：2026-04-14

## 目标

实现一套在 Claude Code 中运行的开发流程 agent 系统，包含 Architect/Developer/Reviewer/Tester 四种角色，支持 Skill/Subagent/Team 三种开发模式，遵循 harness engineering 原则。
后续扩展包含 `Feedback Curator`，用于承担反馈整理和 memory 维护职责。

## 背景

当前项目已有部分 agent 定义（architect.md、code-reviewer.md），但：
- 缺少完整的角色体系（Dev、Tester）
- 缺少流程编排层
- 缺少交接文档规范
- 未定义三种开发模式

本设计旨在建立一套完整的、可独立调用的、可流程化编排的 agent 系统。

## 设计原则

1. **关注点分离**：Agent 定义管能力，Skill 流程管编排
2. **独立可调用**：每个 agent 可独立使用，不依赖流程
3. **Harness Engineering**：交接文档必须写，状态必须追踪
4. **渐进式扩展**：支持后续加入 react-dev、vue-dev 等领域 skill

## 角色定义

### Architect（架构师）

**职责**：
- 文档维护：任务开始前检查计划文档，开发完成后维护 docs/ 和 AGENTS.md

**触发规则**：
- 每个新任务开始前调用：检查计划文档
- 全部开发完成后调用：维护文档

**可用工具**：Read、Grep、Glob、WebSearch、Write、Bash

**可调用 Skills**：待扩展（如 react-dev、vue-dev 等领域规约）

### Developer（开发者）

**职责**：
- 根据计划实现功能
- TDD 开发：先写测试，再实现
- 编写交接文档，记录变更内容

**行为约束**：
- 遵循项目约定（docs/conventions/）
- 提交前自检

**可调用 Skills**：待扩展的领域 skill（如 react-dev、vue-dev 等）

### Reviewer（审查者）

**职责**：
- 审查代码质量和安全性
- 审查不通过时输出 `REJECTED`，由主 agent 记录并进入用户决策点
- 编写交接文档，记录审查结果

**行为约束**：
- 只审查，不修改代码
- 发现问题必须记录
- 审查通过才能进入测试

**可调用 Skills**：无

### Tester（测试工程师）

**职责**：
- 运行测试验证功能
- 运行 lint 检查代码质量
- 测试不通过时输出 `REJECTED`，由主 agent 记录并进入用户决策点

**行为约束**：
- 只测试，不修改业务代码
- 编写交接文档，记录测试结果

**可调用 Skills**：无

## 三种开发模式

### Skill 模式

**适用场景**：单一任务、边界清楚、不需要独立 reviewer 角色或并行审查

**执行方式**：主 agent 按固定状态机执行单 agent workflow，而不是调用 subagent。该模式的详细协议已在 `2026-04-15-dev-workflow-skill-mode-design.md` 中补充。

### Subagent 模式

**适用场景**：需要循环审查、有状态追踪需求

**执行方式**：
- 主 agent 读取 `.claude/agents/` 中的 agent 定义
- 用自然语言传递上下文给 subagent
- Subagent 完成后写交接文档
- 主 agent 读取交接文档，决定下一步

### Team 模式

**适用场景**：需要多角度并行审查

**执行方式**：
- 主 agent 创建 Agent Team
- 多个 Reviewer 并行审查同一份代码
- 结果汇总给主 agent

## 流程定义

### 完整流程

```
用户需求
    ↓
Planner 写计划（writing-plans）
    ↓
用户选择模式
    ↓
┌──────────────────────────────────────┐
│  Skill 模式：单 agent workflow         │
│  Subagent 模式：主 agent 编排调用       │
│  Team 模式：创建 team，并行审查         │
└──────────────────────────────────────┘
    ↓
每个任务开始前 → Architect 检查计划文档
    ↓
Dev → Reviewer → [循环] → Tester → [循环]
    ↓
全部完成 → Architect 维护文档
    ↓
交付
```

**Workflow 层约束**：
- `Subagent` / `Team` 模式：每个角色完成后**必须写交接文档**
- `Skill` 模式：必须产出结构化 `Skill Workflow Record`
- 单独调用时，交接文档或 Skill 记录都作为报告格式输出给用户/主 agent

### Skill 模式最小协议

- 状态机：`Input Ready -> Plan Check -> Execute -> Self Review -> Verify -> Doc Sync -> Final Summary`
- 最小产物：`Skill Workflow Record`
- 发生循环审查、独立 reviewer 需求、高风险工具操作或强状态追踪需求时，升级到 `Subagent` 或 `Team`

### 循环规则

- **Reviewer 审查不通过** → 主 agent 记录阻塞反馈并根据风险决定自动修复回流或保留到最终确认
- **Tester 测试不通过** → 主 agent 记录阻塞反馈并根据风险决定自动修复回流或保留到最终确认
- **循环终止条件**：Reviewer 和 Tester 都通过

### 并行规则

- **Subagent 模式**：顺序调用，可临时起意开启多个 Reviewer 并行
- **Team 模式**：多个 Reviewer 默认并行

## 交接文档格式

所有角色完成后必须编写交接文档，格式如下：

```markdown
## 交接：[from] → [to]

### 任务
[任务描述]

### 完成内容
- 文件变更列表
- 实现摘要

### 结果
[审查结果 / 测试结果]

### 建议
[下一步建议]

### 待解决问题
- [ ] ...

### 状态
APPROVED / REJECTED / BLOCKED
```

**单独调用时的行为**：

当 agent 不通过 workflow 调用时（独立使用场景），交接文档作为**报告格式**输出：
- `to` 填写"用户"或"主 agent"
- 内容聚焦于：该次调用完成的工作、发现的问题、对后续工作的建议
- 仍然必须写，维持 harness engineering 的"所有工作有记录"原则

## 反馈决策规则

- **阻塞型反馈**：`REJECTED` 或 Skill 模式下的严重自检/验证失败都必须先结构化记录，再按风险决定自动修复回流或进入最终确认。
- **非阻塞反馈**：`APPROVED` 下的建议也必须先记录，但可以在最终交付前统一向用户汇总。
- **关键约束**：只有低风险且处于自动执行白名单内的改动才允许自动触发新的实现修改。

## 目录结构

```
.claude/agents/           # Agent 定义（完整能力）
  architect.md            # 架构师
  developer.md            # 开发者
  reviewer.md             # 审查者
  tester.md               # 测试工程师

skills/
  dev-workflow/           # 流程胶水层
    SKILL.md              # 入口 + 三种模式 + 交接文档格式
```

## 文件清单

### Agent 定义（`.claude/agents/`）

1. `architect.md` - 架构师：规划、设计、文档维护
2. `developer.md` - 开发者：TDD 实现、交接文档
3. `reviewer.md` - 审查者：代码审查、质量把关
4. `tester.md` - 测试工程师：测试验证、lint 检查

### Skill 流程层（`skills/dev-workflow/`）

1. `SKILL.md` - 入口文档，包含：
   - 三种模式定义和使用场景
   - 统一交接文档格式
   - 调用方式说明

## 调用方式

用户通过自然语言描述需求：
- "帮我用 developer 实现这个功能"
- "启动完整流程：dev → reviewer → tester"
- "开 3 个 reviewer 并行审查这段代码"

主 agent 读取对应 agent 定义，用自然语言传递上下文。

## 与现有流程的衔接

```
用户需求
    ↓
brainstorming（如需）→ writing-plans → [此处] dev-workflow
    ↓
交付
```

## 扩展点

1. **领域 Skill**：后续可加入 react-dev、vue-dev 等，Developer agent 调用
2. **Team 模式完善**：多角色并行协作
3. **状态追踪**：交接文档持久化到 git

## 参考

- OpenAI Harness Engineering Principles
- Claude Code Agent Teams 文档
- 现有 `.claude/agents/architect.md`、`code-reviewer.md`
