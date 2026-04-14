# Tech Debt Tracker

> 持续跟踪技术债务，小额支付而非大爆炸重写。

## 运行债务列表

| Item | Area | Notes | Priority |
|------|------|-------|----------|
| 缺少测试脚本 | QA | `package.json` 中无 test script | HIGH |
| 缺少 lint 配置 | QA | 无 ESLint 或对应工具配置 | HIGH |
| 缺少 CI workflow | CI/CD | 无 GitHub Actions 自动化 | MEDIUM |
| `orchestrate.md` 为 Legacy shim | 架构 | 实际编排逻辑已移至 skills，该文件仅为兼容性入口 | LOW |
| AGENTS.md Agent 团队表引用旧路径 | 文档 | 旧路径 `.harness/agents/` 应更新为 `docs/design-docs/` | LOW |

## 优先级说明

- **HIGH**：影响开发效率和代码质量，应优先处理
- **MEDIUM**：值得规划但不影响当前开发
- **LOW**：建议处理，不紧急
