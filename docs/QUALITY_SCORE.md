# Quality Score — cc-harness

## 质量记分卡

| 标准 | 目标 | 现状 | 信号来源 |
|------|------|------|---------|
| **测试覆盖** | 仓库自检可运行 | 部分 | `package.json` 中的 `test` 脚本已运行 harness consistency check |
| **Eval 场景覆盖** | 关键 workflow 有回归入口 | 部分 | `docs/references/eval-scenarios.md` 定义场景矩阵，`scripts/checks/harness-evals.js` 校验 Skill 模式关键场景已纳入 |
| **镜像同步机制** | 单一事实源可重复同步 | 部分 | `scripts/sync/mirror-claude-artifacts.js` 和 `npm run sync:mirrors` 已提供最小同步入口，consistency check 负责发现失配 |
| **Linting** | 代码规范检查 | 部分 | 当前以 repo-local consistency check 替代传统 lint，覆盖文档与索引一致性 |
| **TypeScript 类型** | 类型安全 | TBD | 无 `tsconfig.json` |
| **CI/CD** | 自动化构建 | TBD | 无 `.github/workflows/` |
| **Harness 文档新鲜度** | 无过时交叉链接 | 部分 | harness consistency check 已验证关键索引与引用 |
| **Exec plan 完整性** | active 计划有进度追踪 | 部分 | `docs/exec-plans/active/` 已有计划，仍需脚本化核对 index 一致性 |

## 能力成熟度

| 能力 | 当前成熟度 | 说明 |
|------|-----------|------|
| Harness consistency | 已接入 | 已有 repo-local 结构/文档一致性检查 |
| Harness eval planning | 已接入基础版 | 已有场景矩阵与最小 eval 检查入口 |
| Skill mode evals | 已纳入首批 | 覆盖闭环、升级、自检记录、验证不确定性 |
| Fixture-based regression | 规划中 | 仍待补 fixture 仓库与行为回归 runner |
| Mirror sync tooling | 已接入基础版 | 可从 `.claude/` 同步到根目录与 `.codex`，仍待更细粒度工作流集成 |

## 说明

cc-harness 目前以 Markdown + Claude Code Skills 为核心交付物，代码量较少。质量标准的目标是确保 harness 文档本身的一致性，以及 agent / workflow 契约与仓库事实保持一致，而非传统代码覆盖率。

## 行动项

- 添加 `package.json` 中的 repo-local check 入口
- 增加 harness consistency check 脚本
- 增加 harness eval check 脚本与场景矩阵
- 补充关键状态文档的自动一致性校验

## 链接

- 可靠性预期：[RELIABILITY.md](../RELIABILITY.md)
- 安全约定：[SECURITY.md](../SECURITY.md)
