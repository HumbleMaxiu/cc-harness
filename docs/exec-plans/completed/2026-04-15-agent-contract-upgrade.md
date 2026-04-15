# Agent Contract Upgrade 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 升级 `architect`、`developer`、`reviewer`、`tester` 四个 agent 的交接契约和专项能力，使其更适合被 `dev-workflow` 与 `feedback-curator` 稳定编排。

**架构：** 通过统一交接文档骨架定义公共字段，并分别增强四个 agent 的专项职责；同步更新 `.claude/agents/`、`docs/design-docs/`、`skills/dev-workflow/` 和 `docs/product-specs/agent-system.md`，保证契约、编排、说明三处一致。

**技术栈：** Claude Code Agent definitions (Markdown), Skills (Markdown), 产品规格和设计文档

---

## 文件结构概览

```text
.claude/agents/
  architect.md
  developer.md
  reviewer.md
  tester.md

docs/design-docs/
  architect.md
  developer.md
  reviewer.md
  tester.md
  2026-04-15-agent-contract-upgrade-design.md

skills/
  dev-workflow/SKILL.md

.claude/skills/
  dev-workflow/SKILL.md

docs/product-specs/
  agent-system.md
```

### 任务 1：升级四个 agent 的契约与专项能力

**文件：**
- 修改：`.claude/agents/architect.md`
- 修改：`.claude/agents/developer.md`
- 修改：`.claude/agents/reviewer.md`
- 修改：`.claude/agents/tester.md`
- 测试：人工检查角色职责、输入输出和边界是否互补

- [ ] **步骤 1：增强 Architect**

加入计划校验清单、范围确认和文档影响矩阵，并升级交接文档格式。

- [ ] **步骤 2：增强 Developer**

加入按 `task_id` / `step_scope` 执行、checkbox 完成报告和结构化自检结果。

- [ ] **步骤 3：增强 Reviewer**

加入 blocking、severity/confidence、spec/plan/prevents-recurrence 检查，以及 recurrence candidate 判断。

- [ ] **步骤 4：增强 Tester**

加入测试矩阵、复现命令、环境假设、未覆盖风险和 blocking 区分。

### 任务 2：同步设计文档与 workflow 契约

**文件：**
- 修改：`docs/design-docs/architect.md`
- 修改：`docs/design-docs/developer.md`
- 修改：`docs/design-docs/reviewer.md`
- 修改：`docs/design-docs/tester.md`
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 测试：检查公共骨架与角色专项字段表述一致

- [ ] **步骤 1：更新 design-doc 页面**

让四个 design-doc 页面与 agent 定义中的输入、输出和专项能力保持一致。

- [ ] **步骤 2：更新 workflow 交接骨架**

在 `dev-workflow` 中定义统一交接骨架和与 `feedback-curator` 对齐的关键字段。

- [ ] **步骤 3：同步 `.claude` skill 副本**

确保 `.claude/skills/dev-workflow/SKILL.md` 与 `skills/dev-workflow/SKILL.md` 保持一致。

### 任务 3：同步产品规格并做一致性检查

**文件：**
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/design-docs/index.md`
- 测试：全文检索旧表述，检查是否仍有旧契约残留

- [ ] **步骤 1：更新产品规格**

把统一交接契约和四个 agent 的增强输出反映到 `agent-system` 产品规格中。

- [ ] **步骤 2：更新索引与状态**

确认设计文档索引准确，必要时更新实现状态。

- [ ] **步骤 3：一致性检查**

检索 `task_id`、`step_scope`、`blocking`、`severity`、`confidence`、`test_matrix`、`docs impact` 等关键术语，确认无冲突残留。
