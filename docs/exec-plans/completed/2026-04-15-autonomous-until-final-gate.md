# Autonomous Until Final Gate 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 将 `cc-harness` 从“Reviewer / Tester 阻塞即用户决策”升级为“流程自治运行，用户仅在最终统一确认”，并补齐 Claude Code 运行层的危险模式配置说明与示例。

**架构：** 先落设计文档和执行计划，作为本轮事实来源；再通过仓库自检定义新的完成标准；然后同步 workflow、agent、feedback memory、README、示例设置和项目默认设置；最后运行 `npm test` 确认仓库约束一致。

**技术栈：** Markdown skills / agents、Node.js checks、Claude Code settings JSON

---

## 任务 1：落设计文档和索引

**文件：**
- 创建：`docs/design-docs/2026-04-15-autonomous-until-final-gate-design.md`
- 修改：`docs/design-docs/index.md`
- 修改：`docs/exec-plans/index.md`

- [x] 创建设计文档，覆盖协作层与运行层双层设计
- [x] 在 `docs/design-docs/index.md` 添加索引项
- [x] 在 `docs/exec-plans/index.md` 添加 active 计划项并移除 `暂无`

## 任务 2：先写失败中的仓库自检

**文件：**
- 修改：`scripts/checks/harness-consistency.js`

- [x] 增加对 autonomous workflow 文档语义的检查
- [x] 增加对 Claude Code 示例设置中 `skipDangerousModePermissionPrompt` 的检查
- [x] 增加对 README 运行层说明的检查

## 任务 3：升级 workflow / agents / feedback memory

**文件：**
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`.codex/skills/dev-workflow/SKILL.md`
- 修改：`agents/reviewer.md`
- 修改：`agents/tester.md`
- 修改：`agents/feedback-curator.md`
- 修改：`.claude/agents/*.md`
- 修改：`.codex/agents/*.md`
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/feedback/feedback-collection.md`
- 修改：`docs/memory/feedback/agent-feedback.md`

- [x] 去掉中途用户决策点，改成自动修复回流
- [x] 保留 Tester “事实不明时可向用户确认验证入口”的例外
- [x] 将 feedback memory 改成“自动处理 + 最终确认”语义

## 任务 4：补齐 README / AGENTS / 设计文档 / 设置示例

**文件：**
- 修改：`README.md`
- 修改：`AGENTS.md`
- 修改：`docs/design-docs/reviewer.md`
- 修改：`docs/design-docs/tester.md`
- 修改：`docs/design-docs/feedback-curator.md`
- 修改：`examples/claude-code/global-settings.json`
- 修改：`examples/claude-code/project-settings.json`
- 修改：`.claude/settings.json`
- 修改：`.codex/settings.json`
- 修改：`docs/memory/feedback/user-feedback.md`

- [x] 记录用户反馈并同步到规范
- [x] 说明 workflow 自治与运行层设置的关系
- [x] 在示例和默认配置中加入 `skipDangerousModePermissionPrompt`

## 任务 5：验证并收尾

**文件：**
- 必要时更新：相关 docs 索引

- [x] 运行 `npm test`
- [x] 全文检索旧语义，确认没有明显残留
- [x] 准备交付摘要与剩余风险
