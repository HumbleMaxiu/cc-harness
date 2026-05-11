# Quality Score — cc-harness

## 质量记分卡

| 标准 | 目标 | 现状 | 信号来源 |
|------|------|------|---------|
| **测试覆盖** | 仓库自检可运行 | 未接入 | 当前没有 repo-local test 脚本 |
| **Install smoke** | 安装脚本可生成 Claude Code / Codex 运行目录 | 手动验证 | 运行 `./install.sh --target both --dest <tmp-project>` |
| **Linting** | 代码规范检查 | 未接入 | 当前没有 lint/check 脚本 |
| **TypeScript 类型** | 类型安全 | TBD | 无 `tsconfig.json` |
| **CI/CD** | 自动化构建 | TBD | 无 `.github/workflows/` |
| **Harness 文档新鲜度** | 无过时交叉链接 | 手动维护 | 交付前人工检查关键索引与引用 |
| **Exec plan 完整性** | active 计划有进度追踪 | 部分 | `docs/exec-plans/active/` 已有计划，仍需脚本化核对 index 一致性 |

## Harness Audit 映射

`/harness-audit` 应优先复用本页的质量维度，而不是输出另一套脱节的健康口径。当前建议的检查映射如下：

| 审计分类 | 主要检查 | 仓库信号 / 命令 |
|---------|---------|----------------|
| 文档与索引 | 关键文档存在、索引覆盖、链接有效 | 当前手动检查 |
| Workflow 健康 | active / completed plan、Run Trace 相关约定、workflow 契约 | `docs/exec-plans/index.md`、`skills/dev-workflow/SKILL.md` |
| Eval 与验证 | 安装冒烟是否可运行 | `install.sh`、`scripts/install.mjs` |
| Memory / Feedback | memory 入口、feedback 结构、防止再犯链路 | `docs/memory/index.md`、`docs/feedback/feedback-collection.md` |
| Install 完整性 | 安装脚本、hook 配置、role skills | `install.sh`、`scripts/install.mjs`、`scripts/hooks/` |

## 审计输出契约

`/harness-audit` 的输出建议固定为：

```markdown
### Harness Audit Report
- total_score:
- category_scores:
- passed_checks:
- warnings:
- failed_checks:
- remediation:
```

其中 `category_scores` 应优先对应上表，而不是临时自由发挥。

## 能力成熟度

| 能力 | 当前成熟度 | 说明 |
|------|-----------|------|
| Harness consistency | 未接入 | repo-local consistency check 已移除 |
| Harness eval planning | 待重建 | fixture 时代的 behavior eval 已移除，后续应围绕 installer smoke 和 role-skill contracts 重建 |
| Role skill checks | 手动维护 | 通过文档和 review 维护核心 role skills |
| Install smoke test | 手动验证 | 可通过安装脚本生成 Claude Code 与 Codex 目标运行配置 |
| Installer tooling | 已接入基础版 | 可从根目录事实源安装到 Claude Code 与 Codex 目标项目 |

## 说明

cc-harness 目前以 Markdown + Skills 为核心交付物，代码量较少。质量标准的目标是确保 harness 文档本身的一致性，以及 role skill / workflow 契约与仓库事实保持一致，而非传统代码覆盖率。

## 行动项

- 如需要自动化质量门禁，重新设计轻量 repo-local check 入口
- 如需要 eval，围绕当前 source-first 安装模型重新设计场景矩阵
- 补充关键状态文档的一致性校验策略
- 将 `harness-audit` 输出与本页的质量维度一一映射

## 链接

- 可靠性预期：[RELIABILITY.md](../RELIABILITY.md)
- 安全约定：[SECURITY.md](../SECURITY.md)
