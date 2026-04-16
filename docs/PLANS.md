# Plans — cc-harness

## 当前路线图

`cc-harness` 当前不再只按“仓库搭起来了没有”来规划，而是按产品能力缺口推进。现阶段路线图分为 `P0 / P1 / P2` 三层。

### P0 — 可发现性与执行连续性

目标：让用户知道从哪里开始，并且让计划在长任务中持续留在上下文里。

- [x] 提供 `/harness-help`、`/harness-guide`、`/harness-audit`、`/harness-quality-gate`
- [x] 为 `docs/exec-plans/active/` + Run Trace 增加持续 planning hooks
- [x] 增加 `/plan-persist` 作为轻量 planning 入口

### P1 — 验证严谨度与健康信号

目标：让“做完了”的判断更可审查，而不是只靠实现者自述。

- [x] 新增 `Challenger` 角色，挑战 plan、claim 和外部 API 假设
- [x] 将 `docs/QUALITY_SCORE.md` 与 `/harness-audit` 绑定成可执行审计模型
- [ ] 继续扩展 audit 对 freshness、workflow completeness、evidence strength 的覆盖

### P2 — 经验复用与产品叙事

目标：让仓库不仅能执行单次任务，也能把重复经验沉淀成长期产品能力。

- [x] 建立 feedback / recurrence -> `Skill Promotion Candidate` 升级路径
- [x] 建立 pain point matrix 与对外能力地图
- [ ] 让 `harness-setup` 更系统地推荐 shared skill / project-local skill 组合

## 当前能力地图

| 能力层 | 代表入口 | 主要解决什么问题 |
|--------|----------|------------------|
| 根入口 | `/harness-help`、`/harness-guide` | 不知道从哪开始 |
| Planning | `/brainstorming`、`/writing-plans`、`/plan-persist` | 先想清楚，再进入执行 |
| Execution | `/dev-workflow` | 实现、审查、验证形成闭环 |
| Documentation | `/doc-sync` | 代码变了但文档没跟上 |
| Audit / Gate | `/harness-audit`、`/harness-quality-gate` | 交付前缺少健康检查和门禁 |
| Retention | `/feedback`、memory、recurrence | 反馈只停留在聊天里 |

## 下一阶段关注点

下一阶段优先级仍然按下面顺序推进：

1. 强化 planning drift detection，而不引入第二套计划事实源
2. 让 Challenger 更稳定接入 `dev-workflow`
3. 扩展 audit 的证据强度与文档新鲜度信号
4. 让 memory -> skill 的升级路径更自动化

## 常用维护动作

### 添加新 Domain
1. 在 `docs/product-specs/` 创建 `<domain>.md`
2. 更新 `docs/product-specs/index.md`
3. 在 `AGENTS.md` 文档导航表中追加一行

### 添加新 Agent
1. 在 `.claude/agents/` 创建 `<role>.md`
2. 镜像到 `agents/` 和 `.codex/agents/`
3. 在 `docs/design-docs/index.md` 追加链接
4. 在 `AGENTS.md` Agent 团队表中追加一行

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
