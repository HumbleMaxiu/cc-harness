# Product Spec — MCP Integration

> **Domain：** mcp-integration

## 目标

提供 MCP（Model Context Protocol）server 的集成和配置支持，让 cc-harness 能够对接外部工具和服务。

## 用户可见行为

### 已集成 MCP Servers

| MCP Server | 用途 | 配置方式 |
|------------|------|---------|
| GitHub | PR 管理、Issue、搜索 | Claude Code 内置 MCP 配置 |
| Notion | 笔记数据库操作 | MCP server 配置 |
| Playwright | 浏览器自动化 | MCP server 配置 |
| Exa | 神经搜索 | skills/exa-search/SKILL.md |

### 添加新 MCP Server

1. 在 Claude Code 中配置 MCP server 连接信息
2. 在 `docs/references/` 添加 `<server>-llms.txt` 作为 LLM context stub
3. 在 `docs/PRODUCT_SENSE.md` 或相关 domain spec 中记录该 MCP 的用途

## Edge Cases

- **认证失败**：确保 MCP server 的认证信息通过环境变量或 Claude Code secrets 管理
- **MCP 超时**：参考 [docs/RELIABILITY.md](../RELIABILITY.md) 中的超时约定

## 相关文档

- 安全约定：[docs/SECURITY.md](../SECURITY.md)
- 参考文献：[docs/references/index.md](../references/index.md)
