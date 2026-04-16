# Fresh Repo

Minimal harness scaffold for a new project.

## 文档导航

| 类别 | 路径 | 内容 |
|------|------|------|
| 设计理念 | [docs/DESIGN.md](docs/DESIGN.md) | 系统设计原则和目标 |
| 路线图 | [docs/PLANS.md](docs/PLANS.md) | 执行阶段和产品路线图 |
| 产品感觉 | [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | 产品为谁服务、什么是"好" |
| 质量评分 | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | 质量维度的记分卡 |
| 可靠性 | [docs/RELIABILITY.md](docs/RELIABILITY.md) | 超时、重试、幂等性、observability |
| 安全 | [docs/SECURITY.md](docs/SECURITY.md) | Secrets、auth、audit 预期 |
| Memory | [docs/memory/index.md](docs/memory/index.md) | 项目记忆与反馈索引 |
| 执行计划 | [docs/exec-plans/](docs/exec-plans/index.md) | 主动执行中的计划 |
| 产品规格 | [docs/product-specs/](docs/product-specs/index.md) | 各领域产品规格文档 |

## Skill 快速参考

| Skill | 用途 |
|-------|------|
| `/harness-setup` | 为项目搭建或更新 harness |
| `/dev-workflow` | 实现、审查、验证和反馈整理 |
| `/doc-sync` | 基于变更同步相关文档 |

## How to use this harness

| 场景 | 从这里开始 | 然后 |
| ---- | ---------- | ---- |
| 新功能 | `docs/product-specs/<domain>.md` | 在 `docs/exec-plans/active/` 创建计划 → 实现 → 移动到 `completed/` |
| Bug 修复 | `docs/RELIABILITY.md` + `docs/SECURITY.md` | 修复 → 更新 `docs/QUALITY_SCORE.md` |
| 架构变更 | `ARCHITECTURE.md` | 添加 `docs/design-docs/<name>.md` → 从 index 链接 → 实现 |

Tech debt、文档维护和其他工作流请参阅 [docs/PLANS.md](docs/PLANS.md)。
