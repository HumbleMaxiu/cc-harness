# Autonomous Until Final Gate 设计

> 目标：让 Claude Code 在 harness 内持续推进实现、审查、测试和修复，中途不再因为 Agent 反馈停下来询问用户；用户只在最后统一确认产物与总结报告。

## 背景

当前 `cc-harness` 已经把多角色协作和 feedback memory 结构化，但主流程仍保留多个“用户决策点”：

- Reviewer `REJECTED` 后立即询问用户是否继续修复
- Tester `REJECTED` 后立即询问用户是否继续修复
- 非阻塞建议在交付前统一询问是否执行

这会导致 Agent 流程虽然结构化，但无法真正持续运行。与此同时，Claude Code 运行时本身还可能因为危险模式权限确认而暂停。因此，要实现“中途不打断、最后统一确认”，必须同时处理两层：

1. **协作层**：workflow / agents / feedback memory 的中途确认点
2. **运行层**：Claude Code 自身的危险模式确认设置

## 设计目标

1. 主流程在任务执行期间默认自治推进
2. Reviewer / Tester 的阻塞反馈默认进入自动修复循环，而不是中途询问用户
3. `feedback-curator` 继续记录反馈，但职责改为记录自动处理轨迹和最终汇总
4. 用户只在最终交付时看到：
   - 最终产物
   - 已执行验证
   - 自动修复摘要
   - 仍未解决的风险
   - 未自动执行的高风险建议
5. README、示例配置和默认项目设置明确说明：如果希望 Claude Code 运行时也尽量不弹确认，需要启用 `skipDangerousModePermissionPrompt`

## 非目标

- 不通过 hook 绕过 Claude Code 自身权限系统
- 不承诺对所有外部命令、外部网络或系统级高权限操作都能完全零确认
- 不修改 `brainstorming` / `writing-plans` 的前置设计门槛

## 方案对比

### 方案 A：Autonomous Until Final Gate（推荐）

- Reviewer / Tester 的 `REJECTED` 进入自动修复循环
- 非阻塞建议默认按风险分流：低风险自动处理，高风险进入最终报告
- 用户只在最终交付统一确认

**优点：**
- 真正接近“持续运行”
- 与用户目标一致
- 保留审查、测试和 memory 轨迹

**代价：**
- 需要同步更新 workflow、agents、feedback 文档和设置说明

### 方案 B：仅自动处理非阻塞建议

- `REJECTED` 仍停下来问用户
- 仅 `APPROVED` 下建议自动推进

**优点：** 改动小
**缺点：** 仍无法持续运行，不满足目标

### 方案 C：增加 autonomous_mode 开关

- 新增模式开关，允许自治或人工 gate 两种流程

**优点：** 灵活
**缺点：** 范围更大，需要额外状态传播和兼容策略

## 推荐设计

采用 **方案 A**，并把约束写清楚：

### 1. Workflow 状态迁移

`Developer -> Reviewer -> Tester` 主链保持不变，但状态迁移改为：

- Reviewer `REJECTED`：
  - 记录反馈
  - 主 agent 自动回到 Developer 修复
  - 不进入用户决策点
- Tester `REJECTED`：
  - 记录反馈
  - 主 agent 自动回到 Developer 修复
  - 不进入用户决策点
- Reviewer / Tester `APPROVED`：
  - 继续主流程
- 最终交付前：
  - `feedback-curator` 汇总自动处理轨迹、剩余风险和建议
  - 主 agent 向用户一次性交付并请求最终确认

### 2. Feedback 语义升级

`agent-feedback.md` 不再把“是否已询问用户”作为主字段，而改成记录：

- 本次反馈是否已自动执行
- 是否进入最终汇总
- 用户最终决定

这样 memory 记录的重点从“等待用户批准”转为“自动处理可审计 + 最终确认可追踪”。

### 3. Feedback Curator 职责升级

`feedback-curator` 改为：

- 记录 Reviewer / Tester / self-check 的结构化反馈
- 标记哪些反馈已自动处理
- 汇总哪些风险需要在最终交付时提示用户
- 继续维护 recurrence 提名

它仍然：

- 不直接改业务代码
- 不直接改规范
- 不替代主 agent 做最终交付

### 4. Reviewer / Tester 行为升级

Reviewer / Tester 保持“只审查 / 只测试”的专业边界，但不再承担中途阻塞用户的职责：

- Reviewer 输出 `REJECTED` 代表“必须修复后才能继续测试”，而不是“必须先问用户”
- Tester 输出 `REJECTED` 代表“当前验证未通过，需要自动回流修复”
- 当 Tester 无法可靠判断验证入口时，仍允许向用户确认，因为这是事实缺失，不是流程决策

### 5. Claude Code 运行层设置

本仓库不能通过 hook 关闭 Claude Code 自身的权限提示。运行层要通过设置显式开启危险模式确认跳过：

```json
{
  "skipDangerousModePermissionPrompt": true
}
```

这项设置的作用是减少 Claude Code 自身对危险模式的确认弹窗。它与 workflow 自治是互补关系：

- **只改 workflow，不改设置**：Agent 逻辑不中途问，但运行时仍可能弹权限确认
- **只改设置，不改 workflow**：运行时更顺畅，但 harness 仍会在 Reviewer / Tester 反馈时停下来问用户
- **两者都配置**：最接近“持续运行，最后统一确认”

## 影响范围

### 必改

- `skills/dev-workflow/SKILL.md`
- `agents/reviewer.md`
- `agents/tester.md`
- `agents/feedback-curator.md`
- `docs/product-specs/agent-system.md`
- `docs/feedback/feedback-collection.md`
- `docs/memory/feedback/agent-feedback.md`
- `README.md`
- `AGENTS.md`
- `examples/claude-code/*.json`
- `.claude/settings.json`

### 同步文档

- `docs/design-docs/reviewer.md`
- `docs/design-docs/tester.md`
- `docs/design-docs/feedback-curator.md`
- `docs/memory/feedback/user-feedback.md`

## 验收标准

1. `dev-workflow` 不再要求 Reviewer / Tester 的 `REJECTED` 立即询问用户
2. Reviewer / Tester / Feedback Curator 定义与设计文档语义一致
3. `agent-feedback.md` 明确改成“自动处理 + 最终确认”语义
4. README、示例配置和项目默认设置都包含 `skipDangerousModePermissionPrompt`
5. 仓库自检能发现：
   - 文档仍残留“REJECTED 必须立即询问用户”的旧规则
   - 设置示例缺少 `skipDangerousModePermissionPrompt`
6. 用户最终只需要确认产物和总结报告，而不是流程中的每次回退修复
