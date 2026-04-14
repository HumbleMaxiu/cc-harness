## 行为规则（必须遵守）

### 开发工作流
- 对于新功能/架构变更/复杂重构，必须先头脑风暴（提出方案 → 用户批准 → 写设计文档）再开始
  - HARD-GATE：设计批准前禁止写实现代码（brainstorming）

### 反馈与记忆
- 用户反馈必须写入 `docs/memory/feedback/user-feedback.md` 并立即应用
- Agent 反馈必须写入 `docs/memory/feedback/agent-feedback.md`，执行前先征求用户同意
- 同类问题出现 2 次或以上时，必须同步到 `docs/memory/feedback/prevents-recurrence.md` 并更新相关规范
