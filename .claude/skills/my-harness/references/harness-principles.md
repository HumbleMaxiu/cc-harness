# Harness engineering principles (OpenAI)

来源：[Harness engineering (OpenAI)](https://openai.com/zh-Hans-CN/index/harness-engineering/) — 提炼出为 coding agents 搭建仓库时的**可操作规则**。

## 1. Repository as the system of record

- **仅限版本化的仓库内知识。** 如果存在于聊天、Google Docs 或头脑中，agent 在运行时无法看到它。
- 优选 **Markdown、schemas 和可执行计划**，agents 可以 grep、diff 和在 PR 中更新。

## 2. AGENTS.md is a map, not an encyclopedia

- 目标 **约 100 行**（数量级）：**目录** + 指向 `docs/` 的指针。
- **反模式：** 一个巨大的 `AGENTS.md` 挤占了 task context，且在没有机械检查的情况下会腐坏。
- **反模式：** 将一切标记为"critical" — 当一切都很重要时，反而没有重点。

## 3. Progressive disclosure

- **Layer 1：** Skill 元数据 / 简短入口。
- **Layer 2：** `AGENTS.md` — 稳定路由到更深的文档。
- **Layer 3：** `docs/` — 产品、设计、计划、references。
- **Layer 4：** `docs/references/` — 面向 LLM 的长转储（`.txt`）、vendor 节选、只增不减的 context。

Agents 应该**从小开始**并**跟随链接**，而不是加载所有内容。

## 4. Structured `docs/` as record system

- **design-docs/** — 原则、command/API UX、索引目录。
- **product-specs/** — 每个 domain 的行为；从索引链接。
- **exec-plans/** — 计划作为一等 artifact：`active/`、`completed/`、`tech-debt-tracker.md`。
- **generated/** — 机器生成的文档（OpenAPI、DB schema）；通过脚本重新生成；不要盲目手写编辑。

## 5. Plans and debt are versioned

- **Active** 和 **completed** 执行计划存在于 git 中，这样 agents 可以**无需外部 context**运行。
- **Tech debt** 持续跟踪（小额支付）— 而不是等到大规模重写时成为惊喜。

## 6. Mechanical enforcement

- 将**不变量**编码到 linters、CI 和结构测试中 — 而不仅仅依靠文本。
- **文档维护：** 定期（或自动化）修复过时链接和过时规则。

## 7. Agent readability over human-only polish

- 为**可发现性**优化：清晰的名称、索引、交叉链接、稳定的标题。
- 生成的代码可能不符合人类的风格偏好；**正确性、可维护性以及为下一个 agent 运行提供清晰度**比人类偏好更重要。

## 8. Architecture constraints early

- **严格边界**（层、允许的边）一旦代码库增长就优于临时指令。
- 优选**边界解析**（在 IO 边界验证形状）而不是微观管理实现细节。

## 9. Quality as a scorecard

- 在 `docs/QUALITY_SCORE.md` 中跟踪**差距**（文档、测试、覆盖率、可靠性），并在行为变化时更新。

## 10. Entropy and "garbage collection"

- Agents **放大现有模式** — 好的和坏的。安排**小而频繁**的清理。
- 在仓库中捕获**黄金规则**（简短、可执行），通过 PR 逐步重构而不是批量"大爆炸"债务日。

---

生成新 harness 时，**实例化**这些原则到文件布局和简短的、链接丰富的根文档 — 不要将整个文件粘贴到 `AGENTS.md`。
