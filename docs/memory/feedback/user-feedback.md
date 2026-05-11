# 用户反馈记录

> 用户反馈优先级最高，无需询问，直接记录并应用。长期 memory 应优先沉淀可复用经验、规则和 workflow 改进，而不是只保存一次性问题原话。

## 记录规范

每条反馈记录以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，格式 `uf-YYYYMMDD-NNN` |
| `date` | 反馈日期 (ISO 8601) |
| `session` | 会话上下文（项目/功能名称） |
| `type` | `correction` / `preference` / `request` / `complaint` |
| `content` | 反馈核心内容；保留用户为什么在意这件事，并尽量抽象为可复用经验 |
| `action` | 采取的行动；优先写成已经落地的改法、规则或 workflow 调整 |
| `applied` | 是否已应用 (`true` / `false`) |
| `prevents_recurrence` | 是否需要写入规范防止再犯 |

## 已记录的反馈

<!-- 新反馈追加在此处，按日期倒序 -->

| id | date | session | type | content | action | applied | prevents_recurrence |
|------|------|------|------|------|------|------|------|
| `uf-20260422-003` | `2026-04-22` | `feedback capture boundary` | `correction` | `当前 feedback 记录条件过宽，把“主力、散户、总资金的图例颜色也要和线的颜色对应”“Y 轴 label 颜色用我现在这个，测试用例跟着调整”这类当前任务内的 UI / 测试说明误记成长期用户反馈。长期 feedback memory 应只记录显式 feedback、AI/workflow 体验意见，或会约束未来类似任务的可复用规则；一次性实现指令应留在当前任务上下文。` | 收紧反馈边界：更新 `AGENTS.md`、`docs/feedback/feedback-collection.md` 与三处 `feedback` skill，明确只有“显式反馈”或“跨任务可复用规则”才写入 `user-feedback.md`；当前任务内的 UI 微调、文案修改、颜色选择、测试同步默认视为需求/验收标准，不触发长期 feedback 记录。 | `true` | `true` |
| `uf-20260422-001` | `2026-04-22` | `windows powershell hook hang` | `complaint` | `Windows 用户在 PowerShell 中使用 Claude Code 安装 `cc-harness` 后，如果 Git/Bash 运行方式变化，hook 会弹出可见 bash 窗口；执行 `/harness-setup` 时可能长时间卡在 `stop hook`，bash 窗口无输出。这个问题会让用户误以为 harness 本身卡死，因此 hook runtime 必须把“stdin/EOF 行为不稳定”的 Windows Bash 场景视为一等兼容性问题，避免无限等待。` | 记录为 Windows hook 兼容性反馈；hook 入口采用带超时的 stdin 读取策略；安装脚本把同一份 source hook 复制到目标运行环境，确保在 Windows/Git Bash 下即使 stdin 未正常结束也会 fail-open，而不是把 `/harness-setup` 挂住。 | `true` | `true` |
| `uf-20260417-002` | `2026-04-17` | `docs-first project goal` | `request` | `明确 cc-harness 的项目目标：这是一个以文档为核心的 harness 系统。skills、role skills、hooks、MCPs、commands、rules 都应围绕文档读取、写入、完善和流程收口工作；所有关键 docs 最终都要有对应的读取、维护和使用/收口场景。基础能力稳定后，再逐步接入 UI 还原、e2e 测试生成、测试工具等能力来补全 harness。` | 将该目标上提到项目级文档：在 `AGENTS.md` 增加项目目标锚点，在 `docs/PRODUCT_SENSE.md` 明确产品目标与阶段边界，在 `docs/DESIGN.md` 增加 docs-first / foundation-before-tooling 设计原则，在 `docs/HARNESS_METHODOLOGY.md` 明确“每类关键文档都要有读取 / 维护 / 收口路径”的方法论，确保后续协作围绕同一 north star 展开。 | `true` | `true` |
| `uf-20260417-001` | `2026-04-17` | `feedback skill reusable memory` | `correction` | `feedback skill 在记录用户反馈时，不应该只把问题记下来，而要尽可能沉淀成可复用经验、规则或 workflow 改进；否则 feedback memory 会退化成问题日志，难以指导后续执行。` | 核对 `feedback` skill、feedback 规范和 memory 文档中的现有要求；补强 `/feedback` 的记录原则，明确用户反馈也应优先抽象为可复用经验，并同步更新 user-feedback 与 feedback-collection 文档，避免后续再次退化成纯问题记录。 | `true` | `true` |
| `uf-20260416-002` | `2026-04-16` | `feedback root skill` | `request` | `需要开发一个根 Skill，让用户能直接给项目提 feedback，而不是只能手动描述后再由 agent 临时整理。` | 新增顶级 `/feedback` Skill，专门处理用户反馈提交；同步将 `feedback-query` 收敛为查询入口，并更新 AGENTS、guide、规格和 feedback 文档，让反馈入口在导航中可发现。 | `true` | `false` |
| `uf-20260415-002` | `2026-04-15` | `autonomous until final gate` | `request` | `实现让 claude code 持续运行，不需要用户确认，用户只在最后确认产物和总结报告；并解决 Claude Code 默认会询问用户的问题。` | 新增 autonomous-until-final-gate 设计与实施计划；将 workflow / feedback 语义改为中途自动推进、最终统一确认；补充 Claude Code `skipDangerousModePermissionPrompt` 设置示例与说明。 | `true` | `false` |
