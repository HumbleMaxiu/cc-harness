# Harness Main 借鉴增强路线图实施计划

> **面向代理工作者：** 必需子技能：使用 dev-workflow 来执行实施计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 基于 `harness-main` 的产品化做法，补齐 `cc-harness` 在根入口、持续 planning、claim challenge、health check 和经验沉淀方面的关键能力缺口。

**架构：** 保持 `cc-harness` 现有 `docs/exec-plans/ + Run Trace + Skill Workflow Record` 作为主事实源，不平行引入第二套 planning 体系；优先补“产品入口”和“持续回注”能力，再逐步引入 Challenger、health audit 和 memory-to-skill 闭环。路线图分为 P0 / P1 / P2 三层：P0 解决可发现性和执行连续性，P1 解决验证与组织能力，P2 解决经验复用和对外叙事。

**技术栈：** Claude Code Skills（Markdown）、Agent definitions（Markdown）、Node.js hooks、repo-local checks、docs/product-specs、docs/design-docs

---

## 对标参考（本地路径）

- benchmark_root: `/Users/masiyuan/Downloads/harness-main`
- 关键参考：
  - `/Users/masiyuan/Downloads/harness-main/README.md`
  - `/Users/masiyuan/Downloads/harness-main/references/roadmap.md`
  - `/Users/masiyuan/Downloads/harness-main/references/conventions.md`
  - `/Users/masiyuan/Downloads/harness-main/references/agent-teams.md`
  - `/Users/masiyuan/Downloads/harness-main/references/doc-templates.md`
  - `/Users/masiyuan/Downloads/harness-main/references/skill-guide.md`
  - `/Users/masiyuan/Downloads/harness-main/references/skill-ecosystem.md`
  - `/Users/masiyuan/Downloads/harness-main/templates/task-plan.md`

后续所有“借鉴自 harness-main”的判断，默认以上述本地目录内容为事实来源，而不是依赖口头摘要。

## 对标结论

### 直接借鉴

- `harness-main` 的强项不是某个单一 Skill，而是把 harness 做成一个完整产品：有根入口、有健康检查、有 Skill 推荐、有持续 planning。
- `planning-with-files` 最值得借鉴的是 hooks 持续把计划拉回上下文，而不是它的三件套文件格式。
- `Challenger` 角色补的是“计划与 claim 的对抗式验证”，和普通 code review 不同。
- `harness-help / harness-audit / harness-guide / harness-quality-gate` 让用户更容易发现能力边界和最佳入口。
- pain point matrix 让 roadmap 更像产品路线图，而不只是仓库文档目录。

### 不直接照搬

- 不引入平行的 `task_plan.md / progress.md / findings.md` 事实源
- 不整体迁移到 `harness-main` 的 docs taxonomy
- 不优先引入 enterprise 风格安全 hook 全家桶

## 目标能力拆分

### P0：根入口 + 持续 planning

1. 提供用户可直接调用的 `harness-help / harness-audit / harness-guide / harness-quality-gate`
2. 为当前 `docs/exec-plans/active/` + `Run Trace` 增加 hook 级持续回注能力
3. 定义轻量 planning 入口，但保持与 `writing-plans` 的职责边界

### P1：Challenger + 健康信号

1. 新增 `challenger` agent 角色和 workflow 接入点
2. 将 `QUALITY_SCORE.md` 提升为可执行 audit 的事实来源
3. 增强质量门禁，使其同时覆盖 repo-local checks、docs freshness、workflow completeness

### P2：经验升 skill + 产品叙事

1. 建立 feedback / memory / recurrence → project-local skill 的升级路径
2. 增加 pain point matrix 和对外能力地图
3. 让 `harness-setup` 能按 profile 或项目类型推荐 shared skill / project skill 组合

## 文件结构概览

```text
skills/
  harness-help/
  harness-audit/
  harness-guide/
  harness-quality-gate/
  plan-persist/                      # 名称待定；轻量 planning / hooks 入口
  dev-workflow/

.claude/skills/
  harness-help/
  harness-audit/
  harness-guide/
  harness-quality-gate/
  plan-persist/
  dev-workflow/

.claude/agents/
  challenger.md

scripts/hooks/
  plan-status.js
  plan-refresh.js
  plan-write-reminder.js
  plan-stop-check.js

docs/
  product-specs/
  design-docs/
  references/
  exec-plans/
```

### 任务 1：补全产品级根入口（P0）

**文件：**
- 创建：`skills/harness-help/SKILL.md`
- 创建：`skills/harness-audit/SKILL.md`
- 创建：`skills/harness-guide/SKILL.md`
- 创建：`skills/harness-quality-gate/SKILL.md`
- 创建：`.claude/skills/harness-help/SKILL.md`
- 创建：`.claude/skills/harness-audit/SKILL.md`
- 创建：`.claude/skills/harness-guide/SKILL.md`
- 创建：`.claude/skills/harness-quality-gate/SKILL.md`
- 创建：`.codex/skills/harness-help/SKILL.md`
- 创建：`.codex/skills/harness-audit/SKILL.md`
- 创建：`.codex/skills/harness-guide/SKILL.md`
- 创建：`.codex/skills/harness-quality-gate/SKILL.md`
- 修改：`AGENTS.md`
- 修改：`docs/guides/harness-guide.md`
- 修改：`docs/product-specs/skill-system.md`

- [x] **步骤 1：定义四个根入口的边界**

明确四个入口分别负责：

```text
harness-help          -> 命令索引 + 高频场景入口
harness-audit         -> 项目 harness 健康检查
harness-guide         -> 根据场景推荐使用哪个 Skill / workflow
harness-quality-gate  -> 交付前质量门禁入口
```

- [x] **步骤 2：编写每个 Skill 的输入/输出契约**

至少补齐：

```markdown
## 何时使用
## 何时不要使用
## 最小执行流程
## 输出格式
```

- [x] **步骤 3：将根入口接到导航文档**

在以下文件中显式加入入口：

```text
AGENTS.md
docs/guides/harness-guide.md
docs/product-specs/skill-system.md
```

- [x] **步骤 4：为 `harness-audit` 绑定现有仓库事实**

以这些信号作为检查项：

```text
docs/QUALITY_SCORE.md
scripts/checks/harness-consistency.js
docs/exec-plans/index.md
docs/design-docs/index.md
docs/memory/index.md
```

### 任务 2：为现有 planning 体系增加持续回注（P0）

**文件：**
- 创建：`skills/plan-persist/SKILL.md`
- 创建：`.claude/skills/plan-persist/SKILL.md`
- 创建：`.codex/skills/plan-persist/SKILL.md`
- 创建：`scripts/hooks/plan-status.js`
- 创建：`scripts/hooks/plan-refresh.js`
- 创建：`scripts/hooks/plan-write-reminder.js`
- 创建：`scripts/hooks/plan-stop-check.js`
- 修改：`hooks/hooks.json`
- 修改：`.claude/hooks/hooks.json`
- 修改：`docs/references/run-trace-protocol.md`
- 修改：`docs/RELIABILITY.md`
- 修改：`skills/dev-workflow/SKILL.md`
- 修改：`docs/product-specs/agent-system.md`

- [x] **步骤 1：定义轻量 planning 入口和边界**

保持与 `writing-plans` 的边界：

```text
writing-plans -> 复杂任务、完整实施计划
plan-persist  -> 小任务/bugfix/探索任务的轻量状态持续化
```

不要创建独立的第二套长期事实源，而是复用：

```text
docs/exec-plans/active/*.md
Skill Workflow Record
Run Trace
```

- [x] **步骤 2：设计四类 hooks 的最小行为**

```json
{
  "UserPromptSubmit": "显示当前 active plan + 最近 Run Trace 摘要",
  "PreToolUse": "重读当前 plan 头部与最近 trace，防止漂移",
  "PostToolUse": "写入后提醒更新 Run Trace / Skill Workflow Record",
  "Stop": "检查 active plan 是否仍存在未完成 phase"
}
```

- [x] **步骤 3：定义 plan drift 的最小检测逻辑**

至少检查：

```text
- 当前编辑的文件是否出现在 active plan / Run Trace 中
- 是否存在未关闭的 blocked / rejected 状态
- 是否存在待确认的 Operation Gate
```

- [x] **步骤 4：把 hook 行为写回可靠性文档和 workflow 契约**

确保以下文档统一：

```text
docs/references/run-trace-protocol.md
docs/RELIABILITY.md
skills/dev-workflow/SKILL.md
docs/product-specs/agent-system.md
```

### 任务 3：新增 Challenger 角色（P1）

**文件：**
- 创建：`.claude/agents/challenger.md`
- 创建：`.codex/agents/challenger.md`
- 创建：`docs/design-docs/challenger.md`
- 创建：`docs/design-docs/2026-04-16-challenger-agent-design.md`
- 修改：`AGENTS.md`
- 修改：`docs/design-docs/index.md`
- 修改：`docs/product-specs/agent-system.md`
- 修改：`skills/dev-workflow/SKILL.md`

- [x] **步骤 1：定义 Challenger 的职责边界**

核心输出格式至少包含：

```markdown
- CLAIM:
- CHALLENGE:
- VERIFICATION:
- VERDICT: CONFIRMED / REFUTED / UNVERIFIED
```

- [x] **步骤 2：明确与 Reviewer / Tester 的关系**

边界应为：

```text
Reviewer   -> 代码质量、规范、风险
Tester     -> 验证入口、测试与复现
Challenger -> 计划、claim、API 假设、设计论证的对抗式验证
```

- [x] **步骤 3：接入 dev-workflow 的触发点**

优先两个触发点：

```text
1. 计划形成后，进入实现前
2. Agent 声称完成、但证据复杂或存在外部 claim 时
```

- [x] **步骤 4：补齐文档导航和团队索引**

更新：

```text
AGENTS.md
docs/design-docs/index.md
docs/product-specs/agent-system.md
```

### 任务 4：将 Quality Score 提升为可执行审计模型（P1）

**文件：**
- 修改：`docs/QUALITY_SCORE.md`
- 修改：`docs/product-specs/harness-engineering.md`
- 修改：`skills/harness-setup/SKILL.md`
- 修改：`skills/harness-setup/references/file-specs.md`
- 修改：`scripts/checks/harness-consistency.js`
- 修改：`skills/harness-audit/SKILL.md`

- [x] **步骤 1：把质量维度改成可执行检查项**

至少覆盖：

```text
- 索引一致性
- hooks 是否配置
- active/completed plan 完整性
- memory / feedback 结构
- eval / smoke / behavior checks 是否可运行
```

- [x] **步骤 2：将 `harness-audit` 输出映射到记分卡**

输出格式建议固定：

```markdown
### Harness Audit Report
- total_score:
- category_scores:
- passed_checks:
- warnings:
- failed_checks:
- remediation:
```

- [x] **步骤 3：补一条 repo-local check 路径**

让以下命令链路更清楚：

```bash
npm test
node scripts/checks/harness-consistency.js
node scripts/checks/harness-evals.js
```

### 任务 5：建立 memory -> recurrence -> skill 的升级路径（P2）

**文件：**
- 创建：`skills/skill-suggestion/SKILL.md` 或扩展 `feedback-query`
- 创建：`docs/design-docs/2026-04-16-memory-to-skill-design.md`
- 修改：`docs/feedback/feedback-collection.md`
- 修改：`docs/memory/feedback/prevents-recurrence.md`
- 修改：`docs/product-specs/skill-system.md`
- 修改：`skills/skill-creator/SKILL.md`

- [x] **步骤 1：定义升级触发条件**

例如：

```text
- 同类问题在 feedback / recurrence 中出现 >= 2 次
- 修复动作稳定且具可复用性
- 已有明确输入、输出、边界
```

- [x] **步骤 2：把“推荐生成 skill”写进 feedback 流程**

新增一个显式决策点：

```markdown
### Skill Promotion Candidate
- source_record:
- recurring_pattern:
- candidate_skill_name:
- recommended_scope:
- status:
```

- [x] **步骤 3：与 skill-creator 串起来**

让后续可以从 candidate 直接进入 skill 创建，而不是只停留在 recurrence 文档中。

### 任务 6：补一份 pain point matrix 和对外能力地图（P2）

**文件：**
- 创建：`docs/design-docs/2026-04-16-harness-pain-point-matrix.md`
- 修改：`README.md`
- 修改：`docs/HARNESS_METHODOLOGY.md`
- 修改：`docs/PLANS.md`
- 修改：`docs/product-specs/harness-engineering.md`

- [x] **步骤 1：列出 cc-harness 当前瞄准的核心痛点**

建议先覆盖：

```text
- 先写代码后思考
- 计划漂移
- 验证缺失
- 文档腐坏
- 反馈无法沉淀
- 恢复困难
```

- [x] **步骤 2：为每个痛点绑定当前解法与缺口**

表格格式：

```markdown
| 痛点 | 当前解法 | 强度 | 缺口 | 下一步 |
```

- [x] **步骤 3：把路线图回写到 `docs/PLANS.md`**

将 P0 / P1 / P2 作为下一阶段工作流导航，而不是散落在若干 design doc 中。

## 建议执行顺序

1. 先做 **任务 1**，补产品级根入口，解决“有能力但不可发现”
2. 再做 **任务 2**，补持续 planning，解决“计划存在但会漂移”
3. 然后做 **任务 3 + 任务 4**，补 Challenger 和 audit
4. 最后做 **任务 5 + 任务 6**，完成经验沉淀和产品叙事升级

## 验证计划

- [ ] 根入口 Skill 已在 `skills/`、`.claude/skills/`、`.codex/skills/` 对齐
- [ ] `docs/exec-plans/index.md`、`docs/design-docs/index.md`、`docs/product-specs/index.md` 链接正确
- [ ] `node scripts/checks/harness-consistency.js` 通过
- [ ] hooks 配置能在本地一致性检查中被发现
- [ ] `AGENTS.md`、guide、spec 对根入口和新角色的叙事一致

## 阶段结论

- **P0**：高优先级，直接提升可用性和连续性
- **P1**：中高优先级，提升验证严谨度和健康信号
- **P2**：中优先级，提升长期复用能力和产品表达
