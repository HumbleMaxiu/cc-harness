# Plans — cc-harness

## 当前路线图

`cc-harness` 当前不再只按“仓库搭起来了没有”来规划，而是按产品能力缺口推进。现阶段路线图分为 `P0 / P1 / P2 / P3` 四层。

### P0 — 可发现性与执行连续性

目标：让用户知道从哪里开始，并且让计划在长任务中持续留在上下文里。

- [x] 提供 `/harness-help`、`/harness-guide`、`/harness-audit`、`/harness-quality-gate`
- [x] 为 `docs/exec-plans/active/` + Run Trace 增加持续 planning hooks
- [x] 增加 `/plan-persist` 作为轻量 planning 入口
- [x] 增加 `/follow-goal`，为长跑任务建立 objective、停止条件和 validation loop

### P1 — 验证严谨度与健康信号

目标：让“做完了”的判断更可审查，而不是只靠实现者自述。

- [x] 新增 `Challenger` 角色，挑战 plan、claim 和外部 API 假设
- [x] 将 `docs/QUALITY_SCORE.md` 与 `/harness-audit` 绑定成可执行审计模型
- [ ] 继续扩展 audit 对 freshness、workflow completeness、evidence strength 的覆盖

### P2 — 经验复用与产品叙事

目标：让仓库不仅能执行单次任务，也能把重复经验沉淀成长期产品能力。

- [x] 建立 feedback / recurrence -> `Skill Promotion Candidate` 升级路径
- [x] 建立 pain point matrix 与对外能力地图
- [x] 将 `cc-harness Skill Standard` 接入 `/skill-creator`、`/skill-audit` 和手动检查脚本，支撑 feedback-generated skill
- [ ] 让 `harness-setup` 更系统地推荐 shared skill / project-local skill 组合

### P3 — PM Orchestrator 与端到端交付

目标：从“推荐入口和执行 workflow”升级为“一个 command 从需求推进到上线前 gate”。

- [x] 定义 PM orchestrator 的职责边界和 handoff contract
- [ ] 建立 `/plan-review` 作为 `/writing-plans` 之后、实现之前的可选计划审核 gate
- [ ] 将 `/developer` 收敛为 stack-aware slice executor，并把 TDD discipline 抽成 `/tdd`
- [x] 将 TDD、UI 还原、测试、代码审查、CI/CD 信号纳入统一 stage policy
- [x] 定义审查不通过、测试不通过、CI/CD 失败时的自动回流方案
- [ ] 按 Review Pack Registry 评估并整合 GitHub 开源资源，形成符合本项目质量要求的可复用 skills / references

## 当前能力地图

| 能力层 | 代表入口 | 主要解决什么问题 |
|--------|----------|------------------|
| 根入口 | `/harness-help`、`/harness-guide` | 不知道从哪开始 |
| Planning | `/brainstorming`、`/writing-plans`、`/plan-review`、`/plan-persist` | 先想清楚，检查计划漂移，再进入执行 |
| Long-running Goals | `/follow-goal` | 迁移、大重构、部署 retry 或实验需要持续推进 |
| PM Orchestration | `/pm-orchestrator` | 从需求到开发、测试、review、CI/CD gate 的阶段编排 |
| Execution Skills | `/developer`、`/tdd`、`/reviewer`、`/tester`、`/architect` | 被 PM 按阶段调度的实现、TDD、审查、验证和文档影响判断能力 |
| Documentation | `/doc-sync` | 代码变了但文档没跟上 |
| Audit / Gate | `/harness-audit`、`/harness-quality-gate` | 交付前缺少健康检查和门禁 |
| Retention | `/feedback`、memory、recurrence | 反馈只停留在聊天里 |

## 下一阶段关注点

下一阶段优先级仍然按下面顺序推进：

1. 强化 planning drift detection：新增 `/plan-review`，但不引入第二套计划事实源
2. 让 Challenger 更稳定接入 `/pm-orchestrator`
3. 扩展 audit 的证据强度与文档新鲜度信号
4. 让 memory -> skill 的升级路径更自动化
5. 扩展 PM orchestrator，把 vibe coding 的轻量辅助和 AI coding 的长任务交付流程分层接起来

## 常用维护动作

### 添加新 Domain
1. 在 `docs/product-specs/` 创建 `<domain>.md`
2. 更新 `docs/product-specs/index.md`
3. 在 `AGENTS.md` 文档导航表中追加一行

### 添加新 Role Skill
1. 在 `skills/<role>/SKILL.md` 创建角色 Skill
2. 如需长期设计说明，在 `docs/design-docs/` 追加角色文档
3. 更新 `docs/design-docs/index.md`
4. 更新 `AGENTS.md` 的 Role Skills 表

### 完成执行计划
1. 将计划从 `docs/exec-plans/active/` 移动到 `completed/`
2. 更新 `docs/exec-plans/index.md`
3. 如有长期沉淀价值，回写 `docs/PLANS.md`、`docs/QUALITY_SCORE.md` 或 memory

### Tech Debt 维护
见 [tech-debt-tracker.md](./exec-plans/tech-debt-tracker.md)

## 相关链接

- 执行计划索引：[exec-plans/index.md](./exec-plans/index.md)
- 设计文档索引：[design-docs/index.md](./design-docs/index.md)
- 核心痛点矩阵：[design-docs/2026-04-16-harness-pain-point-matrix.md](./design-docs/2026-04-16-harness-pain-point-matrix.md)
