# Generated Artifacts

> 机器生成文档的占位符。**请勿手写编辑。**

## 说明

cc-harness 目前无运行时生成的 schema（如 API schema、数据库 schema）。如后续引入：

- **API schema**：存放于 `docs/generated/api-schema.md`
- **DB schema**：存放于 `docs/generated/db-schema.md`
- **Marketplace schema**：`.claude-plugin/marketplace.json`（手写维护）

## 重新生成

如需添加生成脚本，在 `scripts/` 目录中创建，并通过 `docs/generated/<schema>.md` 顶部的注释记录命令。
