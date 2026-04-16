# 用户反馈记录

> 用户反馈优先级最高，无需询问，直接记录并应用。

## 记录规范

每条反馈记录以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，格式 `uf-YYYYMMDD-NNN` |
| `date` | 反馈日期 (ISO 8601) |
| `session` | 会话上下文（项目/功能名称） |
| `type` | `correction` / `preference` / `request` / `complaint` |
| `content` | 原始反馈内容 |
| `action` | 采取的行动 |
| `applied` | 是否已应用 (`true` / `false`) |
| `prevents_recurrence` | 是否需要写入规范防止再犯 |

## 已记录的反馈

<!-- 新反馈追加在此处，按日期倒序 -->

| id | date | session | type | content | action | applied | prevents_recurrence |
|------|------|------|------|------|------|------|------|
| `uf-20260416-001` | `2026-04-16` | `plan drift detection` | `complaint` | `在 .claude、skills、.codex 三处镜像不一致时，agent 误判可以直接运行 sync，把 .claude 中较旧的内容重新同步到其他目录，覆盖了用户之前只存在于 skills/.codex 的修改。以后遇到镜像漂移，必须先核实哪一侧是最新事实来源，不能为了通过检查直接 sync。` | 记录为镜像同步事故反馈；新增“镜像漂移时禁止未经核实直接 sync”的防再犯候选规则；后续处理镜像不一致时，先做差异归因，再决定是同步、手动合并，还是暂停并向用户确认。 | `true` | `true` |
| `uf-20260415-002` | `2026-04-15` | `autonomous until final gate` | `request` | `实现让 claude code 持续运行，不需要用户确认，用户只在最后确认产物和总结报告；并解决 Claude Code 默认会询问用户的问题。` | 新增 autonomous-until-final-gate 设计与实施计划；将 workflow / feedback 语义改为中途自动推进、最终统一确认；补充 Claude Code `skipDangerousModePermissionPrompt` 设置示例与说明。 | `true` | `false` |
| `uf-20260415-001` | `2026-04-15` | `claude marketplace install` | `complaint` | `/plugin marketplace add https://github.com/HumbleMaxiu/cc-harness.git` 时报错，`marketplace.json` 的 `plugins.0.homepage` 为非法 URL。 | 将 `.claude-plugin/plugin.json` 与 `.claude-plugin/marketplace.json` 中空字符串 URL 改为真实 GitHub 地址，并在 `scripts/checks/harness-consistency.js` 中新增 homepage/repository URL 校验。 | `true` | `true` |
