# Security — cc-harness

## 安全约定

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
- marketplace.json 中的 skills 路径需与实际文件对应

### 相关文档

- 产品规格：[product-specs/index.md](../product-specs/index.md)
- Agent 系统：[product-specs/agent-system.md](../product-specs/agent-system.md)
