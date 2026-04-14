# References Index

> LLM context stubs — agents 的原始 context 存放处（按需填充）。

## 已有的 Reference 文件

暂无。填充方式：

1. 创建 `docs/references/<tool-name>-llms.txt`
2. 粘贴相关的 vendor docs 长节选或 API 文档
3. 在相关 domain spec 或 design doc 中链接

## 命名规范

按**工具/domain** 命名，而非神秘名称：
- ✅ `design-system-reference-llms.txt`
- ✅ `exa-llms.txt`
- ❌ `notes-llms.txt`（语义不清）

## 填充建议

当某个 Skill 或 Agent 需要引用外部文档时：
1. 判断引用是否**跨多个会话**复用
2. 如果是，在 `docs/references/` 创建对应的 `.txt` 文件
3. 如果只是单次会话临时需要，保留在对话上下文中即可
