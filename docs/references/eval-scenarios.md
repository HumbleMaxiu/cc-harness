# Harness Eval Scenarios

> `cc-harness` 的回归场景矩阵。当前以文档断言 + 最小脚本检查为主，后续可逐步接入 fixture 仓库与更强的行为验证。

## 场景矩阵

| ID | 场景 | 输入仓库状态 | 用户请求 | 预期产物 | 关键失败信号 |
|----|------|-------------|---------|---------|-------------|
| `greenfield-scaffold` | 全新仓库 scaffold | 仅有 README 或空仓库 | 初始化 harness 基础结构 | 生成核心 docs / skills / agents / hooks 约束文件 | 缺少入口文档、索引断链、核心契约未生成 |
| `existing-repo-update` | 已有仓库增量更新 harness | 已存在部分 harness 文件且版本落后 | 升级/补齐现有 harness | 仅更新必要文件，保留用户已有结构 | 覆盖用户内容、未同步索引、旧规则残留 |
| `add-domain-design-plan` | 现有 harness 仓库 | 新增 domain / design doc / exec plan | 维护规格、设计和执行计划 | 新文档被索引、交叉链接正确 | 文档孤岛、exec plan 未入 index、broken links |
| `reviewer-rejected-loop` | Subagent 模式实现中 | Reviewer 返回 `REJECTED` 且风险低 | 自动回流修复并继续主流程 | `Feedback Record` 入 memory，修复后继续循环 | 未记录反馈、错误地直接结束、越权自动修复高风险项 |
| `tester-entrypoint-degrade` | 验证入口不完整或不统一 | 执行 repo-native 验证 | 选择最合适入口并记录降级假设 | `Verification` 记录已执行检查、假设、未覆盖风险 | 假定固定脚本、跳过验证、隐藏不确定性 |
| `memory-feedback-recovery` | `/compact` 或新会话恢复 | 继续进行中任务 | 从 memory / feedback 恢复上下文 | 优先读取 memory index 与 recurrence 约束 | 忽略 memory、丢失阻塞反馈、重复再犯 |
| `bridge-file-merge` | 多来源事实需要汇总 | 汇总计划、实现、反馈与验证 | 生成/合并桥接材料 | 结构化记录一致，可支撑审计与恢复 | 事实来源冲突、遗漏关键阶段、输出不可追踪 |
| `skill-success-loop` | 边界清楚的小任务 | 用 `dev-workflow` 以 Skill 模式完成任务 | 完整执行单 agent workflow | 产出完整 `Skill Workflow Record`，包括 `Mode Decision`、`Self Review`、`Verification`、`Doc Sync`、`Final Summary` | 缺失结构化区块、未执行自检/验证、Skill 模式无闭环 |
| `skill-plan-check-escalation` | 任务跨模块、风险高或边界不清 | 以 Skill 模式启动复杂任务 | `plan-check-skill` 判定升级到 `Subagent` | `Mode Decision.fit_for_skill_mode=false`，包含明确 `escalation_reason`、`plan_gaps`、`scope_risks` | 复杂任务被错误留在 Skill 模式、升级理由空泛 |
| `skill-self-review-feedback-record` | Skill 模式已完成 Execute | 进入自检阶段 | `self-review-skill` 结构化审查变更 | `Self Review` 包含 checklist、issues、`feedback_record`、`escalate_to_subagent` | 只有口头结论、无 `feedback_record` 字段、问题不可复用 |
| `skill-verification-uncertainty` | Repo 验证面不完整或信号冲突 | 进入 Verify 阶段 | `verification-skill` 选择最佳验证并记录不确定性 | `Verification` 包含 detected entrypoints、executed checks、assumptions、uncovered risks、必要时 `feedback_record` | 假装验证充分、未记录未覆盖风险、无升级建议 |

## Skill 模式专项断言

以下断言用于保证 Skill 模式被作为真正的 workflow 能力评估，而不是一句模式说明：

1. `dev-workflow` 必须定义 Skill 模式状态机与 `Skill Workflow Record`。
2. `plan-check-skill` 必须能输出可直接并入 `Mode Decision` 的结构化字段。
3. `self-review-skill` 必须能输出可复用的 `feedback_record`。
4. `verification-skill` 必须在验证不确定时显式记录 `assumptions` 与 `uncovered_risks`。
5. Eval 结论必须覆盖“继续 Skill 模式”与“升级到 Subagent/Team”两类路径。

## 后续扩展

- 为每个场景补最小 fixture 仓库
- 让 `scripts/checks/harness-evals.js` 从文档断言升级为 fixture 回归 runner
- 将质量面板中的 eval 信号从“文档覆盖”升级为“场景通过率”
