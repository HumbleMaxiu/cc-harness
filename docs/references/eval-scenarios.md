# Harness Eval Scenarios

> `cc-harness` 的回归场景矩阵。当前同时包含文档断言回归，以及首批基于 fixture + grader 的行为级验证基线。

## 场景矩阵

| ID | 场景 | 输入仓库状态 | 用户请求 | 预期产物 | 关键失败信号 |
|----|------|-------------|---------|---------|-------------|
| `greenfield-scaffold` | 全新仓库 scaffold | 仅有 README 或空仓库 | 初始化 harness 基础结构 | 生成核心 docs / skills / agents / hooks 约束文件 | 缺少入口文档、索引断链、核心契约未生成 |
| `existing-repo-update` | 已有仓库增量更新 harness | 已存在部分 harness 文件且版本落后 | 升级/补齐现有 harness | 仅更新必要文件，保留用户已有结构 | 覆盖用户内容、未同步索引、旧规则残留 |
| `add-domain-design-plan` | 现有 harness 仓库 | 新增 domain / design doc / exec plan | 维护规格、设计和执行计划 | 新文档被索引、交叉链接正确 | 文档孤岛、exec plan 未入 index、broken links |
| `architect-plan-gate` | 开发前计划 gate | 已有计划候选，准备进入实现 | 由 Architect 判定是否可执行并识别文档影响 | 结构化 `scope confirmation`、计划校验清单、`docs impact matrix` | 未声明 execution readiness、缺失 docs impact、无明确 gate 状态 |
| `developer-tdd-handoff` | 开发实现交接 | 计划已批准，Developer 负责局部变更 | 以 TDD 完成实现并交接 | 结构化 handoff、测试命令、自检结果、明确状态 | 缺少测试证据、自检结果缺失、交接状态模糊 |
| `reviewer-rejected-loop` | Subagent 模式实现中 | Reviewer 返回 `REJECTED` 且风险低 | 自动回流修复并继续主流程 | `Feedback Record` 入 memory，修复后继续循环 | 未记录反馈、错误地直接结束、越权自动修复高风险项 |
| `reviewer-blocking-feedback` | Reviewer 阻塞审查 | Developer handoff 已完成但存在问题 | 输出阻塞 findings 和结构化 `Feedback Record` | `REJECTED` handoff、blocking finding、稳定反馈输入 | 发现问题却未结构化记录、未标记阻塞、状态未拒绝 |
| `tester-entrypoint-degrade` | 验证入口不完整或不统一 | 执行 repo-native 验证 | 选择最合适入口并记录降级假设 | `Verification` 记录已执行检查、假设、未覆盖风险 | 假定固定脚本、跳过验证、隐藏不确定性 |
| `memory-feedback-recovery` | `/compact` 或新会话恢复 | 继续进行中任务 | 从 memory / feedback 恢复上下文 | 优先读取 memory index 与 recurrence 约束 | 忽略 memory、丢失阻塞反馈、重复再犯 |
| `feedback-curator-memory-sync` | Feedback memory 落账 | Reviewer / Tester 交接包含 `Feedback Record` | 由 Feedback Curator 写入 memory 并输出摘要 | 新 `af-*` 记录、自动处理摘要、待最终汇总项 | 未写入 memory、无编号、未输出自动处理摘要 |
| `bridge-file-merge` | 多来源事实需要汇总 | 汇总计划、实现、反馈与验证 | 生成/合并桥接材料 | 结构化记录一致，可支撑审计与恢复 | 事实来源冲突、遗漏关键阶段、输出不可追踪 |
| `skill-success-loop` | 边界清楚的小任务 | 用 `dev-workflow` 以 Skill 模式完成任务 | 完整执行单 agent workflow | 产出完整 `Skill Workflow Record`，包括 `Mode Decision`、`Plan Drift`、`Self Review`、`Verification`、`Doc Sync`、`Final Summary` | 缺失结构化区块、未执行自检/验证、Skill 模式无闭环 |
| `skill-plan-check-escalation` | 任务跨模块、风险高、或缺少计划来源 | 以 Skill 模式启动复杂任务 | `plan-check-skill` 判定升级到 `Subagent` 或阻塞 | `Mode Decision.fit_for_skill_mode=false`，包含明确 `escalation_reason`、`plan_gaps`、`scope_risks`、`plan_drift_watchpoints` | 复杂任务被错误留在 Skill 模式、缺少 `missing-plan` 阻塞、升级理由空泛 |
| `skill-self-review-feedback-record` | Skill 模式已完成 Execute | 进入自检阶段 | `self-review-skill` 结构化审查变更 | `Self Review` 包含 checklist、issues、`feedback_record`、`escalate_to_subagent` | 只有口头结论、无 `feedback_record` 字段、问题不可复用 |
| `skill-verification-uncertainty` | Repo 验证面不完整或信号冲突 | 进入 Verify 阶段 | `verification-skill` 选择最佳验证并记录不确定性 | `Verification` 包含 detected entrypoints、executed checks、assumptions、uncovered risks、必要时 `feedback_record` | 假装验证充分、未记录未覆盖风险、无升级建议 |
| `brainstorming-dev-workflow-e2e` | 小任务端到端 | 任务先从问题探索开始，再进入计划与实现 | 从 `brainstorming` 进入 `dev-workflow` 并在关键节点闭环 | brainstorming 产物、exec plan、`Skill Workflow Record`、完成状态 run trace | 跳过计划、缺少验证、workflow 未到 Done |
| `doc-sync-cross-mode-contract` | 代码或 workflow 已改动，且进入文档同步阶段 | 直接调用 `/doc-sync`，或在 Skill/Subagent 模式进入 `Doc Sync` | `/doc-sync` 识别受影响文档并输出结构化同步结果 | `Doc Sync Result` 包含 docs_checked、docs_updated、reviewed_no_change、follow_up_needed、nav_or_index_updated | 文档同步仍靠自由发挥、缺少 reviewed_no_change、Architect 与 dev-workflow 口径漂移 |

## Skill 模式专项断言

以下断言用于保证 Skill 模式被作为真正的 workflow 能力评估，而不是一句模式说明：

1. `dev-workflow` 必须定义 Skill 模式状态机与 `Skill Workflow Record`。
2. `plan-check-skill` 必须能输出可直接并入 `Mode Decision` 的结构化字段。
3. `Plan Drift` 必须在 `Execute` 后和 `Final Summary` 前被检查，并记录偏移状态。
4. `self-review-skill` 必须能输出可复用的 `feedback_record`。
5. `verification-skill` 必须在验证不确定时显式记录 `assumptions` 与 `uncovered_risks`。
6. `/doc-sync` 必须能输出跨模式复用的 `Doc Sync Result`。
7. Eval 结论必须覆盖“继续 Skill 模式”与“升级到 Subagent/Team”两类路径。

## 行为级 eval 基线

- `scripts/checks/harness-behavior-evals.js` 会发现带 `grader.js` 的 fixture，并运行其 `samples/`
- `reviewer-rejected-loop` 已作为首个完整样板，包含 `task.md`、`input/`、`grader.js`、通过/失败样例
- `architect-plan-gate`、`developer-tdd-handoff`、`reviewer-blocking-feedback`、`tester-entrypoint-degrade`、`feedback-curator-memory-sync` 提供了 5 个核心 agent 的单体行为样板
- `brainstorming-dev-workflow-e2e` 提供了一个从 `brainstorming` 到 `dev-workflow` 的小任务端到端样板
- 后续新场景应优先沿用同一结构，先写 grader，再补通过/失败样例，最后再接真实 harness 输出
- 推荐评分同时覆盖：
  - 最终仓库状态
  - 结构化 run trace
  - feedback / memory 写入
  - gate / auto-remediation 是否符合风险模型

## 后续扩展

- 为每个场景补 `task.md + input/ + grader.js + samples/`
- 把真实 harness 运行结果接到 `--submission` 入口，而不只跑内置样例
- 将质量面板中的 eval 信号从“文档覆盖”逐步升级为“场景通过率”
