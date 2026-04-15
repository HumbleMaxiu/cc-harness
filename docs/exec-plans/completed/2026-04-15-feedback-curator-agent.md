# Feedback Curator Agent 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 新增 `feedback-curator` agent，并把它接入现有 `dev-workflow` 的反馈记录与用户决策链路。

**架构：** 通过新增 `.claude/agents/feedback-curator.md` 承担反馈整理职责；由 `skills/dev-workflow/` 定义触发点和主流程衔接；同步更新 AGENTS、产品规格、设计文档和 memory 说明，确保“记录、提名、用户决策、规范升级”边界清晰。

**技术栈：** Claude Code Agent definitions (Markdown), Skills (Markdown), 项目文档

---

## 文件结构概览

```text
.claude/agents/
  feedback-curator.md

skills/
  dev-workflow/SKILL.md

.claude/skills/
  dev-workflow/SKILL.md

docs/
  design-docs/
  product-specs/
  feedback/
  memory/
  exec-plans/

AGENTS.md
```

### 任务 1：新增 Feedback Curator agent 定义

**文件：**
- 创建：`.claude/agents/feedback-curator.md`
- 修改：`AGENTS.md`
- 测试：人工检查 agent 职责、边界和团队索引是否一致

- [ ] **步骤 1：编写 agent 定义**

写出 `feedback-curator` 的职责、禁止事项、触发时机、输入输出格式和写入边界，确保它可以写 memory 文件但不能直接推动代码修改或规范变更。

- [ ] **步骤 2：更新团队索引**

把新 agent 加入 `AGENTS.md` 的 Agent 团队表格和必要说明，使仓库入口文档能发现该角色。

- [ ] **步骤 3：人工校验**

检查 `feedback-curator` 与 `architect`、`reviewer`、`tester` 的职责是否无重叠冲突。

### 任务 2：将 curator 接入 dev-workflow

**文件：**
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 测试：人工检查 workflow 主链路、触发点和决策规则

- [ ] **步骤 1：补充角色表和触发点**

在 workflow 中声明 `feedback-curator` 的角色定位，并明确“交接后触发一次、交付前汇总一次”的接入点。

- [ ] **步骤 2：更新流程描述**

把 Reviewer/Tester 产出 `Feedback Record` 后由 curator 落 `agent-feedback.md` 的流程写清楚，并明确主 agent 负责向用户发起决策。

- [ ] **步骤 3：同步 `.claude` 副本**

确保 `.claude/skills/dev-workflow/SKILL.md` 与 `skills/dev-workflow/SKILL.md` 内容一致。

### 任务 3：同步 supporting docs 和 memory 约定

**文件：**
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/feedback/feedback-collection.md`
- 修改：`docs/memory/feedback/agent-feedback.md`
- 修改：`docs/memory/feedback/prevents-recurrence.md`
- 修改：`docs/design-docs/index.md`
- 修改：`docs/design-docs/2026-04-14-dev-workflow-agent-system-design.md`
- 测试：全文检索关键术语，确认没有旧规则残留

- [ ] **步骤 1：更新产品规格和反馈规范**

把 curator 的存在、职责边界和接入点写入产品规格与反馈规范。

- [ ] **步骤 2：更新 memory 文件格式说明**

让 `agent-feedback.md` 和 `prevents-recurrence.md` 能容纳 curator 的记录与提名行为，但不引入复杂状态模型。

- [ ] **步骤 3：一致性检查**

用全文检索检查 `feedback-curator`、`Feedback Record`、`REJECTED`、`prevents-recurrence`、自动打回等关键表述，确认主流程语义统一。
