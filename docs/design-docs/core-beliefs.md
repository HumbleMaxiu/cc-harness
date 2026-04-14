# Core Beliefs — cc-harness

## 核心工程信念

以下原则指导 cc-harness 的所有设计和实现决策。

### 1. 交接文档必须写

所有 agent 完成工作后必须输出交接文档（结构化 Markdown）。口头或记忆中传递的上下文不可靠——下一个 agent 无法看到。

### 2. 文档是代码的一部分

Harness 文档（AGENTS.md、design-docs、exec-plans）存在 Git 中，与代码同等重要。文档腐坏等同于代码腐坏。

### 3. 渐进式披露

Agent 从小开始（AGENTS.md → 导航索引 → 具体文档），按需深入。避免在入口文件塞入所有信息。

### 4. 交接有据可查

Agent 工作流中每个角色之间通过交接文档传递上下文。循环（打回重做）有记录，终止条件明确。

### 5. TDD 优先

Developer 角色必须先写失败测试，再实现功能。未经验证的代码不能声称完成。

### 6. Reviewer 是门禁

Reviewer 审查不通过 = 代码不能进入测试阶段。Reviewer 保持独立，不修改代码。

### 7. 质量门禁可执行

质量标准（测试门槛、lint 规则）应编码到工具中，而非仅靠约定。

### 8. 最小化 hooks

Claude Code hooks 仅在必要时引入，避免对工具默认行为的过度侵入。

### 9. 无状态优先

Agent 定义和 Skill 流程应尽可能无状态、可幂等，允许可重复调用。

### 10. Markdown-first

所有文档使用 Markdown，agents 可以 grep、diff、在 PR 中更新。
