# Harness Methodology — cc-harness

> 用于指导 `cc-harness` 产品演进的方法论文档。

## 这份文档回答什么

本文件不定义某个单独功能，也不替代 `docs/product-specs/` 中的领域规格。

它回答的是更上层的问题：

- 什么是值得构建的 harness
- harness 应如何随项目复杂度演进
- 哪些约束应固化为 scaffold、agent 契约、workflow、hook 或 check
- 哪些内容应该暴露给最终用户，哪些应该保留为内部方法论

## 方法论立场

### 1. 先最小可用，再增加 agentic 复杂度

参考 OpenAI 与 Anthropic 对 agent 系统的共同建议，`cc-harness` 应默认从最简单、最可解释的形态起步：

- 优先单 agent + 清晰工具，而不是默认多 agent
- 优先预定义 workflow，而不是默认开放式自治 agent
- 只有当单 agent 已经因为职责过多、工具混淆、条件分支失控而失效时，才拆分角色

对 `cc-harness` 的含义：

- scaffold 默认提供最小角色集和最小文档集
- 多 agent 编排是升级路径，不是入门门槛
- 任何新能力都应先回答：“不用新增 agent，能否通过更好的 prompt、tool schema、文档结构解决？”

### 2. harness 不是提示词集合，而是“可恢复的执行环境”

一个好 harness 不只是 system prompt。
它应当同时提供：

- 明确角色边界：谁负责设计、实现、审查、验证
- 可恢复上下文：设计、计划、反馈、长期记忆都在仓库中
- 可执行约束：规则不仅写在文档里，还能被检查、被门禁、被 workflow 使用
- 人机交接点：何时自动继续，何时必须回到用户确认

因此，`cc-harness` 的核心产物不是某几个 prompt，而是：

- 文档结构
- 角色契约
- 执行流程
- checks / hooks / memory

### 3. 文档分层要服务“决策压缩”

harness 的目标不是让 agent 看到更多文档，而是让它更快找到正确层级的信息。

因此应坚持分层：

- 项目级长期事实：`AGENTS.md`、`ARCHITECTURE.md`、`docs/DESIGN.md`、`docs/PRODUCT_SENSE.md`
- 领域级目标与边界：`docs/product-specs/*.md`
- 任务级设计与执行：`docs/design-docs/*.md`、`docs/exec-plans/*.md`
- 反馈与长期记忆：`docs/memory/feedback/*`
- 外部参考材料：`docs/references/*`

演进原则：

- 稳定知识向上沉淀
- 临时执行细节留在下层
- 入口文档只做导航，不承载全部细节

### 3.1 每类关键文档都要有“读取 / 维护 / 收口”路径

`cc-harness` 不应满足于“生成了一套 docs/ 骨架”。更高的要求是：

- 每类关键文档都要有明确的读取方
- 都要有明确的维护入口
- 都要有真实的使用或流程收口场景

例如：

- `AGENTS.md`：被用户与 agent 读取，作为导航和规则入口
- `docs/product-specs/`：被规划与实现流程读取，约束 domain 边界
- `docs/design-docs/`：被任务设计、架构判断和后续实现消费
- `docs/exec-plans/`：被执行流程、Run Trace 和恢复流程消费
- `docs/memory/feedback/`：被 feedback、resume、quality gate 和规范升级路径消费

如果一类文档只能“被创建”，却没有后续读取、维护或收口路径，那么它还不是合格的 harness 组成部分。

### 4. harness 质量取决于 eval，而不只是“看起来合理”

外部最佳实践都指向同一件事：agent 系统必须通过经验性评估持续迭代，而不能只靠人工感觉。

对 `cc-harness`，这意味着每一类 harness 能力都要逐步具备至少一种验证方式：

- 结构正确性：目录、索引、链接、必需文件存在
- 行为正确性：agent 是否遵守交接、反馈、确认门槛
- 安全性：是否避免危险命令、提示词泄漏、越权工具使用
- 恢复性：中断后能否基于 memory / plans 恢复上下文
- 可维护性：新增 domain / agent / workflow 时是否容易扩展

如果某项原则无法被检查，它就还不是稳定工程能力。

### 5. guardrail 应分层，而不是押注单一机制

最佳实践表明，可靠 agent 依赖多层 guardrail，而不是把安全寄托在一段 system prompt 上。

`cc-harness` 应把 guardrail 分为五层：

1. 文档层：在 `AGENTS.md`、设计文档、spec 中声明规则
2. prompt 层：把角色职责、停止条件、确认门槛写进 agent/skill
3. tool 层：限制工具权限、输入格式、可逆性与危险操作
4. workflow 层：把 reviewer、tester、final gate 变成显式阶段
5. check 层：将关键约束编码成 consistency checks 或 CI

原则：

- 高风险规则不能只存在于文档层
- 高频错误应升级到 check 层
- 无法自动检查的部分，也要有明确的人审门槛

## 产品演进框架

### Pain-point-first 产品表达

`cc-harness` 对外不应主要按“有哪些文档、有哪些 skill”来介绍，而应按“用户正在遇到哪类协作失败模式”来介绍。

建议固定使用下面这类表达：

- 先写代码后思考
- 计划漂移
- 验证缺失
- 文档腐坏
- 反馈无法沉淀
- 恢复困难

每个痛点都应该能映射到：

- 当前已有解法
- 当前能力强度
- 尚未解决的缺口
- 下一步增强方向

当前对外矩阵见 [docs/design-docs/2026-04-16-harness-pain-point-matrix.md](docs/design-docs/2026-04-16-harness-pain-point-matrix.md)。

### Docs-first 产品边界

在基础阶段，`cc-harness` 应优先围绕文档中心化能力建设产品：

- 用 skill 做自然语言触发的文档读取、写入、同步和收口
- 用 workflow / agents 做计划、审查、验证、反馈的流程化收口
- 用 scaffold 能力根据项目事实和用户需求生成对应文档骨架
- 用 hooks 在会话过程中持续把文档和状态带回上下文

只有当这些基础能力已经较稳定时，才继续引入更强的外部工具型能力，例如：

- UI 还原度检测
- e2e 测试生成
- 测试执行和验证工具

这样做的目的不是推迟工具接入，而是确保新工具接入后也能纳入已有的文档与 workflow 收口体系，而不是绕开它们形成第二套事实源。

### Phase A：Scaffold 可用

目标：让新项目在最少问答后拥有可运行的基础 harness。

此阶段优先级：

- 生成最小必要文档
- 生成最小角色定义
- 保证 cross-link、索引、目录结构成立
- 不伪造用户未确认的中长期策略

完成标准：

- 新仓库可一次生成基础 harness
- 入口文档能导航到所有核心文档
- 通用 harness self-check 可发现明显缺口

### Phase B：Workflow 可靠

目标：让 harness 不只“存在”，而是能稳定驱动任务执行。

此阶段优先级：

- 明确 brainstorm → design → implement → review → test → final gate
- 强化交接文档与状态流转
- 让 feedback 进入 memory，而不是丢在对话里
- 让阻塞型 agent 反馈可自动回流修复

完成标准：

- 单个任务可以沿标准流程闭环
- 中断后可从 docs/memory 与 exec-plan 恢复
- reviewer / tester 反馈有落点、有后续动作

### Phase C：Constraint 可执行

目标：把“方法论要求”逐步转成系统约束。

此阶段优先级：

- harness consistency checks
- 风险操作门槛
- 文档同步检查
- agent 合约一致性检查
- 关键流程自动化 enforcement

完成标准：

- 高频错误能被自动发现
- 用户无需记住全部规范，系统能主动提醒
- 规则升级有明确路径：反馈 → memory → check / AGENTS.md

### Phase D：Adaptive Harness

目标：让 scaffold 根据项目类型、成熟度、风险级别自适应。

此阶段优先级：

- greenfield / existing repo 区分
- 不同 domain 生成不同文档骨架
- 不同 agent 平台生成不同 bridge
- 根据风险级别调整默认 guardrail 与 workflow 强度

完成标准：

- 小项目不被过度框架化
- 复杂项目不会因默认 scaffold 过浅而失控
- 用户拿到的是“合适的 harness”，不是“最大号 harness”

### Profile-first scaffold

Adaptive Harness 的第一步不是无限扩展模板，而是先明确少量 profile：

- `light`：更轻的骨架、较弱的默认治理措辞、适合快速起步
- `standard`：默认值，覆盖大多数团队协作场景
- `strict`：对高风险项目更明确地强调 gate、验证、恢复和安全

方法论要求：

- 如果检测信号不足，默认推荐 `standard`
- 不因为“可以生成更多文档”就默认推向 `strict`
- profile 只调整强度，不破坏统一的信息架构
- profile 推荐必须给出可解释的仓库信号，而不是凭直觉命名

## 关键设计规则

### 什么时候新增文档

新增文档只应发生在以下情况之一：

- 新增了稳定职责边界
- 新增了跨会话复用的知识
- 新增了需要被多角色共享的规则
- 现有文档已承载两种以上不同时间尺度的信息

否则优先补充现有文档，而不是扩散文件数量。

### 什么时候新增 agent

只有满足以下至少一项，才应考虑新增 agent：

- 单 agent prompt 已出现大量条件分支，难以维护
- 工具集合过多且语义重叠，导致经常选错
- 某职责需要独立门禁，不应与实现者是同一角色
- 该角色输出具有稳定的独立交付物

否则优先保留较少 agent，通过更清晰的职责文案和 workflow 分段解决。

### 什么时候把规则写进 check

满足以下任一条件，就应考虑升级为 check：

- 同类错误重复出现两次以上
- 人工 review 成本高但判断规则清晰
- 错误后果大于修复成本
- 用户或下游 agent 很容易遗漏该规则

### 什么时候沉淀到项目级文档

只有当某个判断已经跨多个任务稳定出现，才应从 `design-docs/` 或 `exec-plans/` 上提到项目级文档。

避免：

- 把一次性任务方案写成长期原则
- 把猜测性 roadmap 写入稳定文档
- 把当前实现偶然性包装成方法论

## 推荐的文档输出策略

这份“方法论文档”应该存在，但建议分成两层：

### 内部方法论层

面向 `cc-harness` 仓库自身演进，回答：

- 我们如何判断 harness 做得更好
- 我们如何决定新增 agent / docs / checks
- 我们如何把外部最佳实践转成产品能力

本文件就属于这一层。

### 用户可见指南层

面向最终用户，回答：

- 这个 harness 能帮我解决什么问题
- 我应该从哪个 workflow 开始
- 什么时候需要升级到更强约束
- 我该如何维护生成出来的 docs / agents / memory

用户版本应更短、更任务导向，避免把内部设计语言直接抛给用户。

用户版本里优先呈现 pain point matrix、根入口和推荐路径；内部方法论里的 guardrail 分层、升级判据和文档层级规则，只保留必要摘要。

## 对“是否提供给用户”的判断

我的判断：**应该提供，但不应原样提供。**

原因：

- 用户需要知道 harness 背后的基本原则，否则会把 scaffold 当模板仓库而非执行系统
- 但内部方法论包含大量产品演进、约束分层、门禁设计内容，直接暴露会增加认知负担
- 更好的做法是从本文件提炼出一份“用户版 harness guide”，保留原则，删去内部治理细节

建议的公开方式：

- 对内保留：`docs/HARNESS_METHODOLOGY.md`
- 对外提炼：后续新增一份用户导向文档，例如 `docs/guides/harness-guide.md` 或 README 中的简版章节

## 接下来应如何使用这份文档

`cc-harness` 后续演进时，新增能力前先用本文件做一次筛选：

1. 这是在增加真实可靠性，还是只是在增加文档和角色数量？
2. 这项规则应落在哪一层：doc、prompt、tool、workflow、还是 check？
3. 这是项目级稳定原则，还是一次性任务细节？
4. 这项复杂度是否真的需要，还是单 agent / 单 workflow 就够了？
5. 用户是否需要看到这部分内容；如果需要，应以什么抽象层级呈现？

## 外部参考

以下材料构成本文档的主要外部依据：

- OpenAI, “A practical guide to building AI agents”  
  <https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/>
- OpenAI API Docs, “Agent evals”  
  <https://platform.openai.com/docs/guides/agent-evals>
- OpenAI API Docs, “Evaluation best practices”  
  <https://platform.openai.com/docs/guides/evaluation-best-practices>
- Anthropic, “Building effective agents”  
  <https://www.anthropic.com/research/building-effective-agents/>
- Anthropic Docs, “Prompt engineering overview”  
  <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview>
- Anthropic Docs, “Use XML tags to structure your prompts”  
  <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags>
- Anthropic Docs, “Tool use with Claude”  
  <https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview>
