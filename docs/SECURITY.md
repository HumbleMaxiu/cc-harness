# Security — cc-harness

## 安全约定

### 工具 / 权限风险分级

`cc-harness` 将“反馈严重性”与“操作风险”分开处理：

- `risk_level`：反馈本身的严重性，继续用于 `low / medium / high`
- `operation_risk`：计划执行的工具或变更风险，统一使用下列等级

| 等级 | 典型动作 | 默认策略 | 自动执行策略 | 最终确认要求 |
|------|---------|---------|-------------|-------------|
| `read-only` | 读文件、搜索、静态分析、只读 diff | 默认允许 | 允许 | 在最终总结中汇报即可 |
| `reversible-write` | 局部代码/文档修改、可回滚配置更新、补测试 | 条件允许 | 仅当命中自动执行白名单且 `risk_level=low` 时允许 | 在最终总结中汇报已执行项与剩余风险 |
| `irreversible-write` | 删除文件、迁移脚本、批量重写、改动难以无损回退的数据/配置 | 默认禁止自动执行 | 不允许 | 执行前需要用户明确确认 |
| `external-side-effect` | 发布、部署、发网络请求、写外部系统、改权限/密钥/计费资源 | 默认禁止自动执行 | 不允许 | 执行前需要用户明确确认 |

### 自动执行白名单 / 黑名单

- **白名单**：`code_fix`、`test_fix`、`doc_sync`
  - 仅当 `operation_risk` 属于 `read-only` 或 `reversible-write`
  - 且 `scope` 为 `local_file` 或无外部副作用的 `cross_module`
  - 且 `risk_level=low`
- **黑名单**：`workflow_rule`、`repo_rule`、删除文件、迁移脚本、发布/部署、权限修改、网络/外部系统写入、任何 `irreversible-write` / `external-side-effect`

### 高风险工具调用约束模板

当任务涉及 `irreversible-write` 或 `external-side-effect` 时，workflow / agent 必须先整理最小约束块，再由用户确认：

```markdown
### Operation Gate
- objective:
- requested_action:
- target_paths_or_systems:
- operation_risk: irreversible-write | external-side-effect
- expected_side_effects:
- reversibility:
- rollback_plan:
- confirmation_status: pending
```

没有这类结构化说明时，不应直接执行高风险动作。

### Secrets 管理

| 规则 | 说明 |
|------|------|
| **禁止硬编码** | API 密钥、令牌、密码不得写入任何 Markdown 文件 |
| **.env 文件** | 本地环境变量放在 `.env`（已在 `.gitignore` 中排除） |
| **NPM token** | 发布时使用 `NPM_TOKEN` 环境变量，不写入文件 |

### 禁止行为（CWE）

- **CWE-95** — 禁止 `eval()` / `exec()` 处理用户输入
- **CWE-78** — 禁止 `shell=True` 传递用户参数
- **CWE-89** — 禁止 SQL 拼接（f-string / format）
- **CWE-798** — 禁止提交 `.env` / `*.key` / `*.pem` 文件

### Audit

- 所有 npm 发布通过 GitHub Actions CI 执行（需手动 trigger approval）
- `.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json` 中声明的路径需与实际文件对应
- 高风险工具调用必须能从交接文档、`Skill Workflow Record` 或最终总结中追溯其 `operation_risk` 与确认状态

### 相关文档

- 产品规格：[product-specs/index.md](../product-specs/index.md)
- Agent 系统：[product-specs/agent-system.md](../product-specs/agent-system.md)
