# References Index

> LLM context stubs — agents 的原始 context 存放处（按需填充）。

## 已有的 Reference 文件

- [Harness Behavior Evals](harness-behavior-evals.md) — 行为级 fixture 规范、grader 约定与 runner 用法
- [Harness Eval Scenarios](eval-scenarios.md) — harness 回归场景矩阵，包含 Skill 模式专项 eval
- [Run Trace Protocol](run-trace-protocol.md) — 运行轨迹最小结构、恢复协议与长期 memory 边界

其他填充方式：

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
