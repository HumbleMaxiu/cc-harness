# Skill Mode Specialized Skills

> `dev-workflow` 的 Skill 模式建议使用少量阶段型专用 Skill 来稳定单 agent workflow；这些 Skill 初期作为内部子 skill 使用，而不是面向用户的顶层入口。

## 设计目标

这些专用 Skill 的作用不是模拟多角色，而是为 Skill 模式的关键阶段提供稳定、可复用、可评估的协议。

第一批只建议定义 3 个：

- `plan-check-skill`
- `self-review-skill`
- `verification-skill`

## 通用原则

### 1. 阶段型，而非角色型

这些 Skill 应服务于阶段：

- Plan Check
- Self Review
- Verify

而不是重新发明：

- architect-skill
- reviewer-skill
- tester-skill

### 2. 作为内部子 skill 使用

初期由 `dev-workflow` 在 Skill 模式下按需调用这些子 skill。

不要急于：

- 在 README 中把它们宣传成用户顶层入口
- 让用户直接绕开 `dev-workflow` 单独使用它们

### 3. 输出必须可并入 Skill Workflow Record

每个专用 Skill 的输出都必须能无缝并入：

- `Mode Decision`
- `Self Review`
- `Verification`

而不是生成另一套平行格式。

## 1. plan-check-skill

### 作用

在 Skill 模式开始前执行最小计划检查，回答两个问题：

1. 当前输入是否足够开始执行
2. 当前任务是否仍适合停留在 Skill 模式

### 输入

- 用户任务描述
- `plan_path`
- 相关 spec / design doc 引用
- `docs/memory/index.md`
- `docs/memory/feedback/prevents-recurrence.md`

### 输出

必须产出可并入 `Mode Decision` 的内容：

```markdown
### Mode Decision
- fit_for_skill_mode: true | false
- escalation_reason:
- plan_gaps:
- scope_risks:
- required_inputs:
```

### 何时升级

遇到以下情况应建议升级为 `Subagent`：

- 范围跨多个模块且边界不清
- 明显需要独立 reviewer / tester 门禁
- 预期需要多轮反馈回流
- 存在高风险不可逆操作

## 2. self-review-skill

### 作用

在 `Execute` 之后执行结构化单 agent 自检，减少 Skill 模式下“做完就算完”的隐式判断。

### 输入

- 变更后的文件列表
- 执行命令摘要
- 当前任务目标
- 相关规范与 memory 约束

### 输出

必须产出可并入 `Self Review` 的内容：

```markdown
### Self Review
- checklist:
- issues_found:
- feedback_record:
- escalate_to_subagent:
```

其中 `feedback_record` 至少应支持：

- `source: self-check`
- `pattern`
- `rule`
- `action_type`
- `risk_level`
- `scope`
- `suggestion`

### 何时升级

遇到以下情况应建议升级为 `Subagent`：

- 自检发现需要独立 reviewer 视角确认的问题
- 已出现第二轮以上修复回流
- 发现任务已超出单 agent 可清晰追踪的复杂度

## 3. verification-skill

### 作用

在 Skill 模式中承担最小 Tester 协议：

- 探测验证入口
- 选择最合适的验证命令
- 记录未覆盖风险

### 输入

- 仓库技术栈线索
- 本轮变更范围
- 用户任务目标
- 已执行命令摘要

### 输出

必须产出可并入 `Verification` 的内容：

```markdown
### Verification
- detected_entrypoints:
- executed_checks:
- assumptions:
- uncovered_risks:
- feedback_record:
```

### 何时升级

遇到以下情况应建议升级为 `Subagent` 或 `Team`：

- 需要多视角验证不同风险面
- 需要独立 tester 门禁
- 验证结果多次失败，已形成循环

## 暂不拆出的阶段

以下阶段先保留在 `dev-workflow` 主 skill 中：

- `Execute`
- `Doc Sync`
- `Final Summary`

原因：

- 高度依赖任务上下文
- 过早拆分会让 Skill 模式碎片化
- 容易把 Skill 模式重新推向伪多角色设计

## 下一步实现建议

1. `plan-check-skill`、`self-review-skill`、`verification-skill` 已可落成内部子 skill 目录骨架
2. 下一步再决定是否补充脚本、模板或 eval fixtures
3. 一旦落成独立 skill，必须同步：
   - `.claude/skills/`
   - `.codex/skills/`
   - consistency check
4. 后续 eval 要覆盖：
   - `plan-check-skill` 的模式判断
   - `self-review-skill` 的反馈记录质量
   - `verification-skill` 的验证入口探测质量

## 最小调用模式

`dev-workflow` 在 Skill 模式下可按以下顺序使用这 3 个内部子 skill：

1. `Plan Check` 阶段加载 `plan-check-skill`，把输出直接写入 `Mode Decision`
2. `Execute` 完成后加载 `self-review-skill`，把输出直接写入 `Self Review`
3. `Verify` 阶段加载 `verification-skill`，把输出直接写入 `Verification`
4. 三者都不单独生成平行报告，而是回填到同一份 `Skill Workflow Record`

简化示意：

```text
dev-workflow (Skill mode)
  -> plan-check-skill
  -> execute task
  -> self-review-skill
  -> verification-skill
  -> doc sync
  -> final summary
```
