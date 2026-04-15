# Dev Workflow Skill Mode 设计文档

> **状态**：草稿
> **日期**：2026-04-15

## 目标

为 `dev-workflow` 的 `Skill 模式` 定义一套独立、可执行、可恢复的 workflow 设计，使其不再只是“主 agent 直接执行各阶段”的抽象描述，而成为与 `Subagent 模式`、`Team 模式` 并列的真实产品能力。

## 背景

当前 `dev-workflow` 已声明支持三种模式：

- Skill 模式
- Subagent 模式
- Team 模式

但从当前仓库实现看，真正被详细定义和落地的主要是：

- 基于角色 handoff 的 agent/subagent 编排
- reviewer / tester 驱动的反馈回流
- feedback-curator 维护 memory

相较之下，`Skill 模式` 目前只有一句执行方式：

> 主 agent 直接执行各阶段

这带来几个问题：

1. `Skill 模式` 没有自己的状态机
2. `Skill 模式` 没有定义最小产物与可恢复边界
3. `Skill 模式` 与 `Subagent 模式` 的差异只剩“是否调用 agent 文件”
4. 用户无法判断什么时候应该停留在 Skill 模式，什么时候应升级
5. 三模式设计在产品上仍不完整

## 外部方法论映射

外部最佳实践里虽然不直接使用“Skill 模式”这一命名，但存在一类与之高度对应的模式：

- Anthropic 所说的 `workflow`
- Anthropic 的 `prompt chaining`
- OpenAI 所强调的 structured prompting / reusable prompt / developer message driven workflow

这些实践的共同点是：

- 先用单个模型执行显式分解的多阶段流程
- 每一步都有清晰目标、输入、输出
- 用结构化中间产物而不是隐式上下文串联步骤
- 只有在固定 workflow 不足时，才升级到更复杂的 agent orchestration

这意味着 `cc-harness` 中的 `Skill 模式` 最合理的定位不是“弱化版 Subagent”，而是：

> **单 agent 执行的显式 workflow 模式**

也就是：

- 仍由主 agent 执行
- 但执行过程必须遵守固定阶段
- 阶段之间通过结构化中间产物衔接
- 具备 gate、反馈回流、最终汇总和恢复能力

## 设计原则

### 1. Skill 模式优先于更复杂编排

默认先尝试 Skill 模式，仅当它无法稳定处理任务时再升级到 `Subagent` 或 `Team`。

### 2. Skill 模式不是“省略协议”

不调用 subagent，不代表可以省略：

- 阶段定义
- 中间产物
- 反馈记录
- 最终汇总

### 3. 单 agent 也必须可恢复

Skill 模式下的执行轨迹不能只存在于对话临时上下文中，至少要生成最小结构化产物，便于：

- `/compact` 后恢复
- 新会话续跑
- 最终审计

### 4. 升级应由复杂度触发，而不是偏好触发

只有当任务出现状态追踪、并行视角、复杂工具编排或反复循环时，才应升级模式。

## Skill 模式定位

### 适用场景

- 单一任务
- 任务边界清楚
- 不需要多角色独立人格
- 不需要并行审查
- 工具数量有限且语义清晰
- 可以接受主 agent 用一个显式流程串行完成

典型例子：

- 小型文档修订
- 单文件或局部代码改动
- 简单 scaffold/update
- 明确输入明确产出的仓库维护任务

### 非适用场景

- 需要独立 reviewer 视角作为强门禁
- 需要复杂循环审查与反复打回
- 需要并行 reviewer / tester 视角
- 需要长时间状态追踪
- 需要跨多个 agent 角色稳定分工

此时应升级到：

- `Subagent 模式`
- 或 `Team 模式`

## 是否需要专用 Skill

### 结论

Skill 模式**应当拥有少量专用 Skill**，但这些 Skill 的职责应是支撑单 agent workflow 的阶段执行，而不是把 Skill 模式重新拆成一组伪角色。

换句话说，应该优先增加：

- 阶段型专用 Skill

而不是：

- 角色镜像型 Skill

### 为什么需要专用 Skill

如果完全不引入任何专用 Skill，Skill 模式容易退化成：

- 主 agent 在一个巨大 prompt 中临时扮演 Architect / Reviewer / Tester
- 每次阶段执行都即兴发挥
- 阶段质量难以稳定
- 后续难以单独做 eval

少量专用 Skill 的价值在于：

- 让单 agent workflow 的阶段有稳定协议
- 让阶段提示可复用、可迭代、可评估
- 降低 `dev-workflow` 主 skill 本体过大、过杂的问题

### 为什么不能按角色拆 Skill

如果把 Skill 模式拆成：

- `architect-skill`
- `developer-skill`
- `reviewer-skill`
- `tester-skill`

那它会重新走向“低配 Subagent”：

- 名称和心智模型上变成角色切换
- 让 Skill 模式和 Subagent 模式边界再次模糊
- 增加过多入口与维护负担

这与 Skill 模式“单 agent 显式 workflow”的定位相冲突。

### 推荐的第一批阶段型专用 Skill

第一批建议只做 2-3 个：

#### 1. `plan-check-skill`

职责：

- 检查计划输入是否完整
- 判断当前任务是否适合停留在 Skill 模式
- 输出 `Mode Decision`

#### 2. `self-review-skill`

职责：

- 对当前变更执行结构化自检
- 输出 checklist、issues、`feedback_record`
- 判断是否需要升级到 Subagent

#### 3. `verification-skill`

职责：

- 探测可用验证入口
- 选择最合适的验证命令
- 输出 `Verification` 区块与未覆盖风险

### 暂不建议拆分的阶段

以下阶段先保留在 `dev-workflow` 主 skill 内：

- `Execute`
- `Doc Sync`
- `Final Summary`

原因：

- 它们更依赖具体任务上下文
- 过早拆分会让 Skill 模式碎片化
- 容易增加不必要的入口复杂度

### 对外暴露策略

初期建议：

- 这些专用 Skill 先作为 `dev-workflow` 的内部子 skill 使用
- 不急着作为用户顶层入口公开宣传

待稳定后再决定是否暴露给用户直接调用。

## Skill 模式状态机

Skill 模式应定义为以下显式状态流：

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

### 状态说明

#### 1. Input Ready

确认以下输入成立：

- 用户请求已明确
- 如属创造性工作，已完成 `brainstorming` / `writing-plans`
- 已读取必要的 memory / prevents-recurrence

若输入不足：

- 停止进入实现
- 向用户要缺失信息
- 或升级到需要更强规划的模式

#### 2. Plan Check

主 agent 在 Skill 模式下承担最小 Architect 职责：

- 检查计划是否存在
- 检查范围是否过大
- 判断是否适合继续停留在 Skill 模式

输出：`Mode Decision Block`

#### 3. Execute

主 agent 进行实现或文档修改。

输出：`Execution Block`

#### 4. Self Review

主 agent 以显式 review checklist 对结果进行一次结构化自检，而不是仅凭“感觉完成”。

至少覆盖：

- 是否满足计划目标
- 是否引入明显风险
- 是否需要升级到独立 Reviewer

输出：`Self Review Block`

#### 5. Verify

主 agent 按 Tester 协议探测并执行最合适的验证入口。

至少输出：

- 发现了哪些验证命令
- 实际运行了哪些
- 未覆盖风险是什么

输出：`Verification Block`

#### 6. Doc Sync

如果代码或规范发生变化，主 agent 必须检查相关文档是否需要同步更新。

输出：`Doc Sync Block`

#### 7. Final Summary

统一整理：

- 变更结果
- 验证结果
- 剩余风险
- 未自动执行建议
- 是否建议下次升级模式

输出：`Final Summary Block`

## Skill 模式最小产物

Skill 模式不要求像 Subagent 模式那样为每个角色生成独立 handoff 文档，但必须至少生成一份结构化任务记录，包含以下区块：

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

这个记录的作用是：

- 替代隐式上下文
- 为 memory / feedback 提供来源
- 为恢复提供锚点
- 让 Skill 模式也具备审计性

## Skill 模式中的反馈处理

### 阻塞反馈

Skill 模式下没有独立 Reviewer，但仍可能出现阻塞反馈，来源包括：

- 自检发现严重问题
- 验证失败
- 文档同步发现规范冲突

处理规则：

1. 先写入结构化 `feedback_record`
2. 按风险等级判断是否允许当前主 agent 自动修复
3. 如果超出 Skill 模式边界，则立即升级到 `Subagent 模式`

### 非阻塞反馈

记录到最终汇总中，并在需要时进入 `docs/memory/feedback/agent-feedback.md`。

## Skill → Subagent → Team 升级规则

### Skill → Subagent

满足以下任一条件时升级：

- 需要独立 reviewer 视角
- 出现 2 轮以上反馈回流
- 任务跨多个模块且状态追踪变重
- 工具使用风险提高
- 主 agent 无法在单一 workflow 中保持清晰边界

### Subagent → Team

满足以下任一条件时升级：

- 需要多个 reviewer 并行提供不同视角
- 需要并行验证不同风险面
- 同一审查阶段存在多个独立问题维度

### 禁止继续停留在 Skill 模式

出现以下情况之一时，不应继续坚持 Skill 模式：

- 已需要独立 gatekeeper 角色
- 已出现高风险不可逆操作
- 需要复杂 tool orchestration
- 任务跨度已经超出单 agent 串行 workflow 的可控范围

## 与 Subagent 模式的边界

Skill 模式与 Subagent 模式的本质区别应为：

### Skill 模式

- 只有一个执行者
- 用 workflow block 模拟阶段推进
- 强调低开销、低切换成本
- 适合较短、较清晰任务

### Subagent 模式

- 存在多个独立角色执行者
- 通过 handoff 文档进行跨角色交接
- 强调角色隔离、门禁和状态追踪
- 适合更复杂的闭环开发任务

这意味着二者不应只是“有没有读 `.claude/agents/*.md`”的区别，而应是执行模型不同。

## 对现有文档的影响

以下内容需要同步调整：

- `skills/dev-workflow/SKILL.md`
  - 为 Skill 模式新增状态机、产物、升级规则
  - 明确哪些阶段未来可由专用 Skill 承担
- `docs/product-specs/agent-system.md`
  - 将 Skill 模式定义为单 agent workflow，而非一句描述
- `README.md`
  - 增加三种模式的可理解对比与示例
- 现有 exec plan
  - 将“Skill 模式具体实现”视为独立能力建设，而非顺手补文案

## 验收标准

完成后应满足：

1. 用户能清楚区分 Skill / Subagent / Team 三种模式
2. Skill 模式具备明确状态机与最小结构化产物
3. Skill 模式下的反馈、验证、文档同步有清晰规则
4. 存在明确的升级条件，而不是凭感觉切换
5. 未来可以为 Skill 模式单独设计 eval 场景
6. 已明确第一批阶段型专用 Skill 的范围与边界

## 建议的后续实现顺序

1. 先改 `skills/dev-workflow/SKILL.md`
2. 定义第一批阶段型专用 Skill 的边界
3. 再同步 `agent-system.md` 与 README
4. 为 Skill 模式补一个最小使用示例
5. 将 Skill 模式纳入后续 harness eval 场景

## 外部参考

- Anthropic, “Building Effective AI Agents”  
  <https://www.anthropic.com/research/building-effective-agents/>
- Anthropic Docs, “Chain complex prompts for stronger performance”  
  <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-prompts>
- Anthropic Docs, “Use XML tags to structure your prompts”  
  <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags>
- OpenAI API Docs, “Prompt engineering”  
  <https://platform.openai.com/docs/guides/prompt-engineering/strategies-for-better-results>
