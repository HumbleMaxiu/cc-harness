# Plans — cc-harness

## 路线图阶段

### Phase 1 — Harness 脚手架 ✅ 已完成
- [x] 创建 AGENTS.md、ARCHITECTURE.md
- [x] 创建 docs/ 目录结构
- [x] 定义 4 个 Agent（Architect、Developer、Reviewer、Tester）
- [x] 完成 dev-workflow SKILL

### Phase 2 — 扩展 Domains（进行中）
- [ ] harness-engineering domain spec
- [ ] skill-system domain spec
- [ ] agent-system domain spec
- [ ] mcp-integration domain spec

### Phase 3 — Quality & Reliability
- [ ] 完善 QUALITY_SCORE.md（基于实际仓库信号）
- [ ] 添加 CI lint 检查 harness 文档一致性
- [ ] 补充 SECURITY.md 具体约定

### Phase 4 — 工具链完善
- [ ] skill-creator SKILL 完善
- [ ] harness-setup SKILL 完善（支持增量 update）
- [ ] 补充 exa-search SKILL

## Workflows

### 添加新 Domain
1. 在 `docs/product-specs/` 创建 `<domain>.md`
2. 更新 `docs/product-specs/index.md`
3. 在 `AGENTS.md` 文档导航表中追加一行

### 添加新 Agent
1. 在 `.claude/agents/` 创建 `<role>.md`
2. 在 `docs/design-docs/index.md` 追加链接
3. 在 `AGENTS.md` Agent 团队表中追加一行

### 完成执行计划
1. 在 `docs/exec-plans/completed/` 创建计划文件
2. 更新 `docs/exec-plans/index.md`

### Tech Debt 维护
见 [tech-debt-tracker.md](./exec-plans/tech-debt-tracker.md)

## 链接

- 执行计划索引：[exec-plans/index.md](./exec-plans/index.md)
- 设计文档索引：[design-docs/index.md](./design-docs/index.md)
