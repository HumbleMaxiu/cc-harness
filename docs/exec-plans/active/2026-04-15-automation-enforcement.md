# Automation Enforcement 实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 将“文档约束到自动化约束”的设计落成一组可执行改动，分别补齐 Tester / workflow 的运行时 enforcement，以及 `cc-harness` 自身的一致性校验。

**架构：** 先把设计文档和索引补齐，作为这轮实现的事实来源；再强化 `Tester` 和 `dev-workflow`，把验证入口探测、阻塞规则和用户决策点写成稳定契约；最后给 `cc-harness` 自己增加最小 consistency check，确保文档、索引、hooks 说明与实现一致。整个方案不强推用户项目固定测试脚本，也不以 CI 为前提。

**技术栈：** Claude Code Agent definitions (Markdown), Skills (Markdown), Node.js scripts, 项目文档

---

## 文件结构概览

```text
.claude/agents/
  tester.md

skills/
  dev-workflow/SKILL.md

.claude/skills/
  dev-workflow/SKILL.md

docs/
  design-docs/
    2026-04-15-automation-enforcement-design.md
    tester.md
    index.md
  product-specs/
    agent-system.md
  feedback/
    feedback-collection.md
  exec-plans/
    active/2026-04-15-automation-enforcement.md
    index.md

scripts/
  checks/
    harness-consistency.js

package.json
```

### 任务 1：落设计文档并同步索引

**文件：**
- 创建：`docs/design-docs/2026-04-15-automation-enforcement-design.md`
- 修改：`docs/design-docs/index.md`
- 修改：`docs/exec-plans/index.md`
- 测试：人工检查 design doc 与 exec-plan 索引是否可达

- [ ] **步骤 1：创建设计文档**

写入 `docs/design-docs/2026-04-15-automation-enforcement-design.md`，内容必须覆盖：

- 背景：当前规则大多停留在文档层
- 分层：agent / workflow / repo check / hook
- Tester 的“验证入口探测协议”
- `cc-harness` 自身 consistency check 的边界
- 验收标准

- [ ] **步骤 2：更新 design-doc 索引**

在 `docs/design-docs/index.md` 中新增一行：

```md
| [2026-04-15-automation-enforcement-design.md](2026-04-15-automation-enforcement-design.md) | 文档约束到自动化约束设计 | 草稿 |
```

- [ ] **步骤 3：更新 exec-plan 索引**

把 `docs/exec-plans/index.md` 的“主动执行中”表格替换为：

```md
| [active/2026-04-15-automation-enforcement.md](active/2026-04-15-automation-enforcement.md) | 文档约束到自动化约束实施计划 | 进行中 |
```

并移除“暂无”占位行。

### 任务 2：强化 Tester 的验证入口探测契约

**文件：**
- 修改：`.claude/agents/tester.md`
- 修改：`docs/design-docs/tester.md`
- 修改：`docs/product-specs/agent-system.md`
- 测试：人工检查 Tester 输入、流程、输出三处表述一致

- [ ] **步骤 1：增强 agent 定义**

在 `.claude/agents/tester.md` 中补入以下行为约束：

- 先探测项目技术栈和验证入口
- 再建立测试矩阵
- 多候选命令时选择推荐项并说明
- 无法可靠判断时询问用户
- 输出中区分已执行验证、环境假设和未覆盖风险

- [ ] **步骤 2：同步设计文档**

在 `docs/design-docs/tester.md` 中补入同样的运行时职责，明确“最小质量门禁”是验证决策流程，而不是固定脚本。

- [ ] **步骤 3：同步产品规格**

在 `docs/product-specs/agent-system.md` 中更新 Tester 描述和交接文档要求，补入：

- 验证入口探测
- 测试矩阵
- 环境假设
- 未覆盖风险

### 任务 3：收紧 dev-workflow 的状态迁移规则

**文件：**
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：`.claude/skills/dev-workflow/SKILL.md`
- 修改：`docs/feedback/feedback-collection.md`
- 测试：全文检索 `REJECTED`、用户决策点、自动实现等关键词，确认语义统一

- [ ] **步骤 1：更新 workflow 主链路**

在 `skills/dev-workflow/SKILL.md` 中明确：

- 创造性任务先经过 brainstorming / planning
- `Developer -> Reviewer -> Tester` 不能跳
- `Reviewer REJECTED` 与 `Tester REJECTED` 都必须先记录反馈，再进入用户决策点
- 非阻塞建议默认只记录，不自动实现

- [ ] **步骤 2：同步 `.claude` 副本**

将同样改动同步到 `.claude/skills/dev-workflow/SKILL.md`，保证运行入口与仓库源文件一致。

- [ ] **步骤 3：同步反馈规范**

在 `docs/feedback/feedback-collection.md` 中补充或修正以下说明：

- 主流程阻塞点由 workflow 控制
- Tester 的验证入口探测属于运行时职责
- hook 不承担主 enforcement 责任

### 任务 4：为 cc-harness 自己增加最小 consistency check

**文件：**
- 创建：`scripts/checks/harness-consistency.js`
- 修改：`package.json`
- 测试：本地运行 `node scripts/checks/harness-consistency.js`

- [ ] **步骤 1：实现检查脚本**

新增 `scripts/checks/harness-consistency.js`，至少检查：

- `AGENTS.md` 中列出的关键文档、skills、agents 是否存在
- `docs/design-docs/index.md` 是否包含真实设计文档
- `docs/exec-plans/index.md` 是否与 `active/`、`completed/` 一致
- 文档中关于 hook 的关键声明是否与实际 hook 行为不冲突

脚本失败时使用 `process.exit(1)`，并输出明确失败项。

- [ ] **步骤 2：增加仓库自身入口**

将 `package.json` 更新为至少包含：

```json
{
  "scripts": {
    "check:harness": "node scripts/checks/harness-consistency.js",
    "test": "node scripts/checks/harness-consistency.js"
  }
}
```

这里的脚本仅服务于 `cc-harness` 自身，不代表对外 harness 契约。

- [ ] **步骤 3：运行最小校验**

运行：

```bash
npm test
```

预期：

- 当前文档和索引一致时返回 0
- 若故意制造缺失文件或漂移，脚本会报出具体失败项

### 任务 5：修正文档漂移并做交付前一致性检查

**文件：**
- 修改：`docs/PLANS.md`
- 修改：`docs/QUALITY_SCORE.md`
- 修改：必要时的相关文档
- 测试：全文检索当前设计涉及的关键术语

- [ ] **步骤 1：修正状态漂移**

检查并修正 `docs/PLANS.md`、`docs/QUALITY_SCORE.md` 中与本轮改动直接相关的陈述，避免出现“设计已落地但状态仍写 TBD”或“文档说有某行为但实现并没有”的情况。

- [ ] **步骤 2：全文检索关键术语**

运行：

```bash
rg -n "验证入口|REJECTED|用户决策点|自动实现|hook|consistency check|check:harness" docs skills .claude scripts
```

预期：

- Tester / workflow / feedback / design doc 的关键表述一致
- 没有明显冲突的旧规则残留

- [ ] **步骤 3：交付前人工复核**

人工确认：

- 设计文档、exec-plan、agent 定义、skill 文档四处说法一致
- 对外 harness 没有强推固定测试脚本
- `cc-harness` 自身拥有最小自动校验入口
