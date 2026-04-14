# Quality Score — cc-harness

## 质量记分卡

| 标准 | 目标 | 现状 | 信号来源 |
|------|------|------|---------|
| **测试覆盖** | 有测试 | TBD | `package.json` 中无 test script |
| **Linting** | 代码规范检查 | TBD | 无 lint 配置 |
| **TypeScript 类型** | 类型安全 | TBD | 无 `tsconfig.json` |
| **CI/CD** | 自动化构建 | TBD | 无 `.github/workflows/` |
| **Harness 文档新鲜度** | 无过时交叉链接 | TBD | 需定期验证 |
| **Exec plan 完整性** | active 计划有进度追踪 | 部分 | `docs/exec-plans/active/` 有文件 |

## 说明

cc-harness 目前以 Markdown + Claude Code Skills 为核心交付物，代码量较少。质量标准的目标是确保 harness 文档本身的一致性，而非传统代码覆盖率。

## 行动项

- 添加 `package.json` test script
- 添加 lint 配置（ESLint 或对应工具）
- 添加 GitHub Actions CI workflow

## 链接

- 可靠性预期：[RELIABILITY.md](../RELIABILITY.md)
- 安全约定：[SECURITY.md](../SECURITY.md)
