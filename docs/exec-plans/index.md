# Exec Plans 索引

## Active

当前没有 active plan。

## Completed

| Plan | 说明 | 状态 |
|------|------|------|
| [2026-05-13-feedback-skill-audit.md](completed/2026-05-13-feedback-skill-audit.md) | 使用独立 `/skill-audit` 审查 `/feedback`，记录自动检查与模型输出 | Completed |
| [2026-05-13-skill-standard.md](completed/2026-05-13-skill-standard.md) | Skill 标准方案实施：标准文档、skill-creator、audit/check script、三方 skill 引入约束 | Completed |
| [2026-05-14-plan-review-gate.md](completed/2026-05-14-plan-review-gate.md) | 新增 `/plan-review` 作为 `/writing-plans` 后、实现前的 PM 可调度计划审核 gate | Completed |
| [2026-05-14-pm-orchestrator-migration.md](completed/2026-05-14-pm-orchestrator-migration.md) | 将旧执行入口迁移为 `/pm-orchestrator`，由 PM 总控负责阶段控制、skill 分配、失败回流和并行/串行策略 | Completed |
| [2026-05-15-developer-tdd-optimization.md](completed/2026-05-15-developer-tdd-optimization.md) | 优化 `/developer` 为 stack-aware slice executor，并新增独立 `/tdd` discipline | Completed |
| [2026-05-18-review-packs-implementation.md](completed/2026-05-18-review-packs-implementation.md) | 新增四个专项 review packs，并接入 PM routing、registry、docs 和安装验证 | Completed |

已移除的 mirror-directory 时代历史 completed plans 已从 active source tree 清理。新的 completed plans 只有在描述当前 source-first、role-skill 架构时才添加到这里。
