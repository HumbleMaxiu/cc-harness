# Plan Review Gate 实施计划

> **面向代理工作者：** 目标运行形态是由 `/pm-orchestrator` 执行本计划；但当前 Codex 会话尚未接入 `/pm-orchestrator` runtime，因此本次实施可由主会话按本文顺序执行。实施完成后必须用 installer smoke 验证未来 Codex / Claude Code runtime 都能安装 `/pm-orchestrator` 与 `/plan-review`。

**目标：** 新增只读 `/plan-review` skill，作为 `/writing-plans` 之后、实现之前的 fresh-eyes 计划审核 gate，并由 `/pm-orchestrator` 判断是否调用。

**架构：** 保持固定主流程 `/brainstorming` -> `/writing-plans` -> `/pm-orchestrator` 不变。`/writing-plans` 只负责产出实施计划；`/plan-review` 以 metaswarm 的 `plan-review-gate` 为主源改编，吸收 fresh-eyes 和 spec critique 的审核视角，只读审核计划质量并输出结构化 `Review Handoff`；`/pm-orchestrator` 按风险决定是否调度，若审核失败则回流 `/writing-plans` 修计划。

**技术栈：** Markdown skills、cc-harness Skill Standard、三方 source attribution、Node.js skill audit scripts、install smoke。

---

## 运行约束

- 不修改 `/brainstorming` 的流程。
- 不把 `/plan-review` 暴露成用户必须手动调用的主入口；它是 PM 可调度的 review gate。
- 当前会话不能假设 `/pm-orchestrator` 已可被 Codex slash 调用；实施时用主会话顺序执行，并在文档中保留 runtime fallback 说明。
- `/plan-review` 不直接编辑 plan，不写代码，不修正文档；只输出 `APPROVED / REJECTED / BLOCKED` 和必要回流建议。
- 如果 plan review `REJECTED`，回流目标是 `/writing-plans`，不是 `/developer`。

## 最佳路线

- 主源改编：引入并改编 `dsifry/metaswarm` 的 `skills/plan-review-gate/SKILL.md` 和 `rubrics/plan-review-rubric-adversarial.md`。采用它的多视角审核思想：可行性、完整性、范围 / 对齐；不要照搬它的并行 reviewer runtime，改成 cc-harness 的单 skill 只读 gate 和 `Review Handoff` 输出。
- Fresh-eyes 核心：吸收 `plan-fresh-eyes-review` gist 的问题意识，即“另一个 agent 能否不猜测地执行计划”。该 gist license 不清晰，本计划只借鉴评审问题，不复制文本。
- 严格计划视角：参考 `arunt14/spec-kit-critique` 的产品 / 工程 critique 方式，把“产品价值、技术可行性、交付风险”作为可选高风险 lens；不引入它的 `/speckit.plan` 命令绑定。
- 未来重型 gate：参考 `luno/spec-kit-plan-review-gate` 的 PR / MR 前置 gate 思路，但本轮不引入 merge request 工作流，也不让 `/plan-review` 依赖 spec-kit 目录。
- 暂不引入：`garrytan/gstack` 的 `plan-eng-review` / `plan-design-review` 与 gstack runtime 和路径绑定较深，本轮只登记为未来 role-specific review pack 候选。
- Superpowers 约束：保留 lightweight policy，不把每个计划都强制送审。是否调度 `/plan-review` 由 `/pm-orchestrator` 按风险判断，避免把流程变成重型三件套。

## 文件职责

- 创建 `skills/plan-review/SKILL.md`：以 metaswarm plan review gate 为主源改编，定义触发场景、只读审核流程、PM 调度条件、输出 contract。
- 创建 `skills/plan-review/references/source.md`：记录三方来源、license、imported commit、import date、本地改编和未引入候选。
- 创建 `skills/plan-review/references/pressure-scenarios.md`：证明该 skill 能阻止计划缺陷进入实现。
- 修改 `skills/pm-orchestrator/SKILL.md`：在 planning -> implementation 之间增加可选 plan review gate 和失败回流。
- 修改 `skills/writing-plans/SKILL.md`：保持交接给 `/pm-orchestrator`，补充 PM 可能调度 `/plan-review`。
- 修改 `skills/writing-plans/plan-document-reviewer-prompt.md`：标记为 legacy reference，指向 `/plan-review` 作为正式 gate。
- 修改 `scripts/checks/skill-standard.mjs` 与 `skills/skill-audit/scripts/skill-standard.mjs`：把 `plan-review` 加入 key skills，要求 pressure scenario。
- 修改 `README.md`、`AGENTS.md`、`docs/guides/harness-guide.md`、`docs/product-specs/skill-system.md`、`docs/product-specs/harness-engineering.md`、`docs/PLANS.md`、`docs/PRODUCT_SENSE.md`：同步新能力和移除“三件套”作为下一步的表述。
- 修改 `docs/exec-plans/index.md`：本计划完成后从 Active 移到 Completed。

### 任务 1：建立红灯验证和 `/plan-review` skill

**文件：**
- 创建：`skills/plan-review/SKILL.md`
- 创建：`skills/plan-review/references/source.md`
- 创建：`skills/plan-review/references/pressure-scenarios.md`
- 修改：`scripts/checks/skill-standard.mjs`
- 修改：`skills/skill-audit/scripts/skill-standard.mjs`

- [x] **步骤 1：运行 RED 检查，证明 skill 尚未存在**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill plan-review --json
```

预期：FAIL，JSON 中包含 `skill not found: plan-review`。如果已经存在，先审查现有实现，不要盲目覆盖。

- [x] **步骤 2：创建 `/plan-review` skill**

创建 `skills/plan-review/SKILL.md`，使用以下结构和语义：

```markdown
---
name: plan-review
description: 只读计划审核 gate。用于 /writing-plans 产出 active exec plan 后、实现前，由 /pm-orchestrator 按风险调度，检查 plan 是否覆盖 spec、可执行、可测试、无占位符，并输出 Review Handoff。
---

# Plan Review

`plan-review` 是实现前的 fresh-eyes gate。它不替代 `/writing-plans`，也不直接修改计划；它只审核 active exec plan 是否足够让另一个 agent 不猜测地执行。

## Source

本 skill 改编自 `dsifry/metaswarm` 的 `plan-review-gate` 和 adversarial plan review rubric。执行时不需要读取 source 仓库；来源、license 和本地改动记录在 `references/source.md`。

## 何时使用

- `/pm-orchestrator` 接收到 `/writing-plans` 产出的 active exec plan，且任务跨模块、跨阶段、高风险或包含并行 lane。
- plan 涉及 public API、数据模型、迁移、权限、安全、支付、发布、CI/CD、UI/e2e 或不可逆操作。
- spec 和 plan 来自不同会话，存在 drift 风险。
- 用户或 PM 明确要求 fresh-eyes plan review。

## 何时不要使用

- 用户还在探索需求：先用 `/brainstorming`。
- 尚未写出实施计划：先用 `/writing-plans`。
- 小型低风险修复，PM policy 判定无需额外 gate。
- 需要审查已实现代码：使用 `/reviewer` 或专项 review pack。
- 需要测试已实现行为：使用 `/tester`。

## 输入 / 读取项

- 用户当前请求和已确认 spec / design doc。
- `docs/exec-plans/active/*.md` 中要审核的计划。
- 计划引用的 `docs/design-docs/`、`docs/product-specs/` 或其他 spec refs。
- `AGENTS.md`、`docs/memory/index.md`、`docs/memory/feedback/prevents-recurrence.md`，如果计划或 PM policy 指向这些约束。
- 计划中声明的文件路径、命令、测试入口和 docs impact。

## 执行流程

1. 确认 plan path、spec refs 和审核范围；缺失 plan 时输出 `BLOCKED`。
2. 用 feasibility lens 检查计划是否能在当前 repo、工具链、权限和 runtime 约束下执行。
3. 用 completeness lens 检查每条关键需求、非目标和验收标准是否能映射到具体任务、测试和文档收口。
4. 用 scope / alignment lens 检查计划是否超出已确认需求、绕过 `/brainstorming` 决策或引入第二套事实源。
5. 用 fresh-eyes lens 检查任务是否有精确文件、代码 / 文案内容、测试命令、预期结果和清晰顺序，另一个 agent 是否能不猜测地执行。
6. 检查 TDD discipline：新行为是否先写失败测试，再实现，再验证通过；纯文档或配置任务必须说明 TDD 例外。
7. 检查 ambiguity：搜索 `TBD`、`TODO`、占位符、模糊动作、未定义 API、未确认命令和未声明依赖。
8. 检查 execution safety：并行 lane 是否文件 ownership 不冲突，高风险动作是否有 gate，docs impact 是否有收口。
9. 输出结构化 handoff。发现会导致实现者猜测、构建错误内容或跳过验证的问题时，返回 `REJECTED`。

## 输出格式

```markdown
### Review Handoff
- capability: plan_review
- source_skill: /plan-review
- files_reviewed:
- spec_refs:
- findings:
- risk_level: low / medium / high
- operation_risk: read-only
- required_fixes:
- optional_suggestions:
- evidence:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- 没有可读取的 active plan。
- plan 引用的关键 spec 缺失，且无法从用户请求中恢复需求。
- plan 和用户确认的需求冲突，需要用户或 `/writing-plans` 重新确认。
- 计划包含高风险外部副作用，但没有 PM operation gate。

## Feedback / Memory Boundary

`plan-review` 的发现默认是本轮 handoff evidence，不直接写入长期 memory。只有重复出现的计划缺陷、用户明确要求记录，或发现会约束未来类似任务的流程规则时，才交给 `/feedback-curator` 判断是否持久化。

## 可调用 Skills

无。由 `/pm-orchestrator` 调度；若 `REJECTED`，PM 回流 `/writing-plans` 修订计划。
```

- [x] **步骤 3：创建 source attribution**

创建 `skills/plan-review/references/source.md`：

```markdown
# Plan Review Source Attribution

## Primary Imported Source

- source_project: `dsifry/metaswarm`
- source_paths:
  - `skills/plan-review-gate/SKILL.md`
  - `rubrics/plan-review-rubric-adversarial.md`
- source_urls:
  - `https://github.com/dsifry/metaswarm/blob/main/skills/plan-review-gate/SKILL.md`
  - `https://github.com/dsifry/metaswarm/blob/main/rubrics/plan-review-rubric-adversarial.md`
- license: MIT License
- imported_commit: `c86fd6c422a8ddb3d5a0524d2acb784359c25b05`
- import_date: `2026-05-14`

## Local Changes

- Replaced metaswarm's multi-reviewer orchestration with a single cc-harness skill controlled by `/pm-orchestrator`.
- Converted the review result to cc-harness `Review Handoff`.
- Added cc-harness docs-first checks, TDD discipline, install portability, feedback boundary and PM failure backflow.
- Kept the feasibility, completeness and scope / alignment review lenses as the main adapted review model.

## Reviewed But Not Imported

- `plan-fresh-eyes-review` gist: useful fresh-eyes concept, but license is unclear; do not copy text.
- `arunt14/spec-kit-critique`: useful product / engineering critique lens; do not bind `/plan-review` to `/speckit.plan`.
- `luno/spec-kit-plan-review-gate`: useful future PR / MR gate model; do not add spec-kit merge workflow in this change.
- `garrytan/gstack` plan review skills: useful role split idea, but too tied to gstack runtime for this repository.

## Compatibility Notes

- Runtime source files needed by `/plan-review` live inside `skills/plan-review/`.
- External projects are attribution and design sources, not runtime dependencies.
- If a future change copies more text or behavior from any reviewed-but-not-imported source, verify its license first and update this file.
```

- [x] **步骤 4：创建 pressure scenarios**

创建 `skills/plan-review/references/pressure-scenarios.md`：

```markdown
# Plan Review Pressure Scenarios

## Scenario 1: Placeholder Looks Harmless

- skill_under_test: `/plan-review`
- pressure: 计划里写着“补充适当测试”和“处理边界情况”，实现者可能以为这是足够的任务描述。
- expected_behavior: 返回 `REJECTED`，要求 `/writing-plans` 写出具体测试文件、测试代码、命令和预期失败/通过输出。
- rationalization_to_reject: “实现者自然知道要补什么测试。”

## Scenario 2: Spec Requirement Has No Task

- skill_under_test: `/plan-review`
- pressure: spec 要求保留现有 installer 行为，但 plan 只创建新 skill，没有 install smoke 或 runtime portability 验证。
- expected_behavior: 返回 `REJECTED`，指出缺少安装验证任务。
- rationalization_to_reject: “skill 文件存在就等于安装会工作。”

## Scenario 3: Parallel Lanes Conflict

- skill_under_test: `/plan-review`
- pressure: plan 建议并行修改 `README.md` 和 `docs/PLANS.md`，但两个 lane 都要同时修改 `skills/pm-orchestrator/SKILL.md`。
- expected_behavior: 返回 `REJECTED` 或要求串行，指出 ownership 冲突。
- rationalization_to_reject: “这些都是文档改动，可以并行。”

## Scenario 4: Scope Drift Looks Helpful

- skill_under_test: `/plan-review`
- pressure: plan 在实现 `/plan-review` 时顺手新增 `/requirements-draft`、`/requirements-review`、`/requirements-confirm`。
- expected_behavior: 返回 `REJECTED`，指出计划偏离已确认路线，必须保持 `/brainstorming`、`/writing-plans`、`/pm-orchestrator` 固定主流程。
- rationalization_to_reject: “需求三件套未来可能有用，现在一起做更完整。”
```

- [x] **步骤 5：把 `plan-review` 加入 key skill 检查**

在两个检查脚本的 `keySkills` 中加入 `"plan-review"`：

```js
const keySkills = new Set([
  "architect",
  "challenger",
  "pm-orchestrator",
  "plan-review",
  "feedback",
  // ...
]);
```

- [x] **步骤 6：运行 GREEN 检查**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill plan-review --json
```

预期：`summary.errors` 为 `0`，`summary.warnings` 为 `0`。

### 任务 2：接入 `/pm-orchestrator` 和 `/writing-plans`

**文件：**
- 修改：`skills/pm-orchestrator/SKILL.md`
- 修改：`skills/writing-plans/SKILL.md`
- 修改：`skills/writing-plans/plan-document-reviewer-prompt.md`

- [x] **步骤 1：更新 PM routing**

在 `skills/pm-orchestrator/SKILL.md` 的 routing 表中把 planning 阶段改为：

```markdown
| implementation plan | `/writing-plans` | `/plan-review` for high-risk or multi-stage plans, `/architect` |
```

- [x] **步骤 2：增加 Plan Review Gate 调度规则**

在 Phase 3 后增加小节：

```markdown
### Plan Review Gate

PM 默认不为每个计划强制调度 `/plan-review`。满足任一条件时 SHOULD 调度：

- 跨模块、跨阶段或多角色 handoff。
- 涉及 public API、数据模型、迁移、权限、安全、支付、发布、CI/CD、UI/e2e 或不可逆操作。
- 计划包含并行 lane 或高风险 operation gate。
- spec 与 plan 来自不同会话，或 PM 发现需求 / 计划可能 drift。
- 用户明确要求 fresh-eyes plan review。

`/plan-review` 返回 `APPROVED` 后才能进入 implementation。返回 `REJECTED` 时回流 `/writing-plans`；返回 `BLOCKED` 时 PM 汇报 blocker 和需要的输入。
```

- [x] **步骤 3：更新 failure backflow**

在 failure table 中加入：

```markdown
| plan review rejected | `/writing-plans` |
| plan review blocked | PM clarification or `/brainstorming` when requirements are unclear |
```

- [x] **步骤 4：更新 writing-plans handoff**

在 `skills/writing-plans/SKILL.md` 的执行交接段落中保留交给 `/pm-orchestrator`，补充：

```markdown
`/pm-orchestrator` 可以根据风险决定是否调度 `/plan-review` 做 fresh-eyes 审核；`/writing-plans` 自身不直接调用 `/plan-review`，也不决定是否进入实现。
```

- [x] **步骤 5：处理旧 reviewer prompt**

把 `skills/writing-plans/plan-document-reviewer-prompt.md` 顶部改为：

```markdown
# 计划文档审查员提示模板（Legacy Reference）

正式计划审核入口是 `/plan-review`。本文件仅保留为历史 prompt 参考；PM 调度时应优先使用 `skills/plan-review/SKILL.md` 的 output contract。
```

### 任务 3：同步用户可见文档

**文件：**
- 修改：`README.md`
- 修改：`AGENTS.md`
- 修改：`docs/guides/harness-guide.md`
- 修改：`docs/product-specs/skill-system.md`
- 修改：`docs/product-specs/harness-engineering.md`
- 修改：`docs/PLANS.md`
- 修改：`docs/PRODUCT_SENSE.md`

- [x] **步骤 1：更新核心 skill 列表**

在 `README.md` 和 `AGENTS.md` 的 skill 表中，在 `/writing-plans` 后加入：

```markdown
| `/plan-review` | 实现前的只读计划审核 gate，由 `/pm-orchestrator` 按风险调度 |
```

在 `docs/product-specs/skill-system.md` 的已内置 skills 表中加入：

```markdown
| plan-review | 实现前的只读计划审核 gate，由 PM 按风险调度 |
```

- [x] **步骤 2：更新典型流程说明**

把 README 典型流程的第 3 步改为：

```markdown
3. 执行阶段进入 `/pm-orchestrator`，由 PM 判断是否先调度 `/plan-review`，再分配实现、review、test、docs sync 和 gate。
```

在 `docs/guides/harness-guide.md` 的开发流程中，把第 5 步改为：

```markdown
5. 通过 `/pm-orchestrator` 执行；高风险或多阶段计划由 PM 先调度 `/plan-review`。
```

- [x] **步骤 3：替换“三件套”路线图**

把 `docs/PLANS.md` P3 中的：

```markdown
- [x] 建立需求文档、需求评审、需求确认的标准 skill / command 入口
```

改为：

```markdown
- [x] 建立 `/plan-review` 作为 `/writing-plans` 之后、实现之前的可选计划审核 gate
```

把下一阶段关注点第 1 条改为：

```markdown
1. 强化 planning drift detection：新增 `/plan-review`，但不引入第二套计划事实源
```

- [x] **步骤 4：更新产品叙事**

把 `README.md` 和 `docs/PRODUCT_SENSE.md` 中“需求文档、需求评审、需求确认”的端到端描述改为：

```markdown
需求和设计澄清、计划编写、计划审核、开发、TDD、UI 还原、测试、代码审查到 CI/CD
```

- [x] **步骤 5：更新文档责任矩阵**

在 `docs/product-specs/harness-engineering.md` 中把 exec plan 维护入口改为：

```markdown
| `docs/exec-plans/*` | `/writing-plans` | `/plan-review` / `architect` / `pm-orchestrator` |
```

### 任务 4：验证安装与一致性

**文件：**
- 修改：无新业务文件；根据验证结果只修复前面任务的文件。

- [x] **步骤 1：运行 targeted skill audit**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill plan-review --json
```

预期：`errors: 0`，`warnings: 0`。

- [x] **步骤 2：运行仓库 skill standard check**

运行：

```bash
node scripts/checks/skill-standard.mjs
```

预期：`status: PASS`。允许旧 skill 保持既有 warnings，但不得新增 `plan-review` 相关 warnings 或 errors。

- [x] **步骤 3：运行 install smoke**

运行：

```bash
tmpdir=$(mktemp -d)
./install.sh --target both --dest "$tmpdir"
test -f "$tmpdir/.codex/skills/pm-orchestrator/SKILL.md"
test -f "$tmpdir/.codex/skills/plan-review/SKILL.md"
test -f "$tmpdir/.codex/skills/plan-review/references/source.md"
test -f "$tmpdir/.codex/skills/plan-review/references/pressure-scenarios.md"
test -f "$tmpdir/.claude/skills/pm-orchestrator/SKILL.md"
test -f "$tmpdir/.claude/skills/plan-review/SKILL.md"
test -f "$tmpdir/.claude/skills/plan-review/references/source.md"
test -f "$tmpdir/.claude/skills/plan-review/references/pressure-scenarios.md"
test ! -e "$tmpdir/.codex/skills/dev-workflow"
test ! -e "$tmpdir/.claude/skills/dev-workflow"
```

预期：所有命令 exit code 为 `0`。

- [x] **步骤 4：运行文案一致性搜索**

运行：

```bash
rg -n "需求文档、需求评审、需求确认|requirements-draft|requirements-review|requirements-confirm|plan-document-reviewer" README.md AGENTS.md docs skills
```

预期：不再有 active roadmap 或用户入口推荐“三件套”；`plan-document-reviewer` 只出现在 legacy reference 或历史 completed plan 中。

### 任务 5：收尾和计划状态

**文件：**
- 修改：`docs/exec-plans/index.md`
- 移动：`docs/exec-plans/active/2026-05-14-plan-review-gate.md` -> `docs/exec-plans/completed/2026-05-14-plan-review-gate.md`

- [x] **步骤 1：完成后移动计划**

运行：

```bash
mv docs/exec-plans/active/2026-05-14-plan-review-gate.md docs/exec-plans/completed/2026-05-14-plan-review-gate.md
```

预期：active 目录不再包含本计划，completed 目录包含本计划。

- [x] **步骤 2：更新 exec plan index**

把 `docs/exec-plans/index.md` 的 Active 段落恢复为：

```markdown
当前没有 active plan。
```

并在 Completed 表中加入：

```markdown
| [2026-05-14-plan-review-gate.md](completed/2026-05-14-plan-review-gate.md) | 新增 `/plan-review` 作为 `/writing-plans` 后、实现前的 PM 可调度计划审核 gate | Completed |
```

- [x] **步骤 3：最终 git 状态检查**

运行：

```bash
git status --short
```

预期：只包含本计划范围内的文件变更，没有 `.codex/`、`.claude/`、临时目录或安装产物。

## 自我审查

- 规范覆盖：本计划覆盖三方来源路线、source attribution、新增 skill、PM routing、writing-plans handoff、文档同步、audit、install smoke 和 active/completed 计划收口。
- 占位符扫描：没有 `TBD` / `TODO` / “稍后实现”作为执行步骤。
- 类型一致性：新入口统一命名为 `/plan-review`，capability 统一为 `plan_review`，输出统一为 `Review Handoff`。
- 当前 runtime 限制：已明确本会话不能假设 `/pm-orchestrator` 可调用，实施时由主会话顺序执行，安装 smoke 验证未来 runtime。
