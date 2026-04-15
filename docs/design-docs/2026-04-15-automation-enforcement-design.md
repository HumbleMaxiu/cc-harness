# Automation Enforcement 设计文档

> **状态**：已实现
> **日期**：2026-04-15

## 目标

将 `cc-harness` 中已经写入文档的关键规则，落到明确的自动化执行面上，使这些规则不再只依赖人工理解。

本次设计聚焦两件事：

1. 为对外提供的 harness 明确 agent / workflow 层的 enforcement 位置
2. 为 `cc-harness` 仓库自身补齐最小一致性校验，保证文档、skills、agents、hooks 的说法可信

## 背景

当前仓库已经具备较完整的 harness 骨架：

- `AGENTS.md` 作为入口
- `docs/` 作为设计、计划、反馈、记忆的系统记录
- `dev-workflow` 作为 A/Dev/R/T 的主流程编排
- `feedback-curator` 负责反馈整理和 recurrence 提名

但现阶段仍存在一个明显缺口：很多规则已经写进文档，却还没有映射到稳定的执行面。

例如：

- 创造性工作前先 brainstorming / planning
- Reviewer 是门禁
- Tester 必须完成验证
- `REJECTED` 必须先记录，再进入用户决策点
- 重复问题需要升级为 `prevents-recurrence`

这些规则已经被写入 `AGENTS.md`、`dev-workflow`、design docs 和反馈规范，但主 agent 仍需要大量依赖“理解文意”而不是“消费契约”来执行。

## 核心问题

### 1. 对外 harness 契约与本仓库约束混在一起

`cc-harness` 是提供 harness 的项目，不应该默认要求所有用户项目提供统一的 `npm test`、`npm run lint` 或 CI。

但 `cc-harness` 自己作为产品实现仓库，应该拥有自己的最小自检能力。

如果不把这两层拆开，最终会出现：

- 对外契约过度侵入
- 对内质量约束又不够硬

### 2. 规则落层不清晰

不同类型的规则应由不同组件承担：

- 角色行为约束：agent
- 状态迁移约束：skill / workflow
- 仓库事实一致性：repo-local checks
- 启动引导：hook

当前项目已经有这些组件，但尚未明确每条规则由哪一层负责。

### 3. Tester 缺少“验证入口探测”能力定义

当前 Tester 强调“运行测试验证功能”，但还没有把下面这套决策过程写成硬契约：

1. 如何识别项目技术栈
2. 如何发现候选测试 / lint / typecheck / build 入口
3. 多个候选入口时如何选择
4. 完全无法判断时如何询问用户
5. 如何区分“已执行验证”和“未覆盖风险”

这会导致 Tester 的门禁更像口号，而不是稳定可执行的流程。

## 设计原则

### 1. 约束落到最接近语义的位置

不把所有规则都推给 hook，也不只停留在文档文字里。

- agent 负责角色行为
- workflow 负责状态流转
- check 脚本负责事实一致性
- hook 只负责轻量提醒

### 2. 对外低侵入，对内高一致

对用户项目：

- 不强制固定测试脚本
- 不强制统一 lint 命令
- 不把 CI 当作产品前提

对 `cc-harness` 自己：

- 文档和实现必须一致
- 关键索引和引用必须有效
- 关键状态文档之间不能明显冲突

### 3. 优先运行时探测，而不是模板预设

验证行为的最小标准不是“必须运行固定脚本”，而是：

- 发现项目的可用验证入口
- 执行当前可执行的验证
- 说明未执行部分的原因
- 在必要时向用户确认

## 约束分层

### Agent 层

这一层负责角色在执行任务时必须遵守的行为约束。

#### Developer

- 缺少已批准设计输入时，不直接进入创造性实现
- 实现前读取 plan / spec / memory
- 输出 handoff 时必须明确本轮范围、执行命令和剩余风险
- 不绕过 Reviewer / Tester 直接宣称完成

#### Reviewer

- 必须输出 `APPROVED / REJECTED / BLOCKED`
- 必须输出 findings
- 必须填写 `Feedback Record`
- 必须标识 recurrence candidate

#### Tester

Tester 的最小质量门禁定义为“验证入口探测协议”：

1. 读取 handoff、spec、memory
2. 探测项目语言、构建系统和可用验证入口
3. 建立测试矩阵
4. 执行当前可执行的验证
5. 记录环境假设和未覆盖风险
6. 输出 `APPROVED / REJECTED / BLOCKED`

探测范围至少包括：

- `package.json` scripts
- `pyproject.toml` / `pytest`
- `cargo test`
- `go test`
- lint / typecheck / build 相关入口

当存在多个候选命令时，Tester 应选择推荐入口并在交接文档中说明。
当无法可靠判断时，Tester 必须向用户确认，而不是编造命令。

### Skill / Workflow 层

这一层负责角色之间的状态迁移和阻塞规则。

#### dev-workflow

`dev-workflow` 应承担以下 enforcement：

- 创造性任务先经过 brainstorming / planning
- `Developer -> Reviewer -> Tester` 的顺序不能跳过
- `Reviewer REJECTED` 时先记录反馈，再进入用户决策点
- `Tester REJECTED` 时先记录反馈，再进入用户决策点
- 非阻塞建议默认只记录，不自动实现
- 交付前由 Architect 维护受影响文档

这里的关键不是新增 shell 拦截，而是把 workflow 进一步收紧成稳定的状态迁移契约。

### Repo Check 层

这一层仅约束 `cc-harness` 自己，不外溢为用户项目要求。

应校验的最小事实包括：

- `AGENTS.md` 中列出的文档、skills、agents 实际存在
- `docs/design-docs/index.md` 与真实设计文档一致
- `docs/exec-plans/index.md` 与 `active/`、`completed/` 一致
- `docs/product-specs/index.md` 与真实 spec 文件一致
- `PLANS.md`、`QUALITY_SCORE.md`、tech debt tracker 不出现明显冲突
- 文档中声明的 hook 行为与实际 hook 行为一致

这部分 enforcement 用于保证：仓库中的文档声明是可信的。

### Hook 层

hook 只承担轻量启动引导，不承担主工作流控制。

适合 hook 的职责：

- 新会话注入最小引导上下文
- 提醒优先使用某个入口 skill

不适合 hook 的职责：

- 判定是否完成 brainstorming
- 强制 TDD
- 判断测试是否充分
- 自动推进多阶段流程

## 规则映射

| 规则 | 执行层 |
|------|--------|
| 创造性任务先 brainstorming | `dev-workflow` + `Developer` |
| Reviewer 不通过不得进入 Tester | `dev-workflow` |
| Tester 必须先探测验证入口再执行验证 | `Tester` |
| `REJECTED` 必须记录并进入用户决策点 | `dev-workflow` + `feedback-curator` |
| 重复问题升级为 `prevents-recurrence` | `feedback-curator` + docs 维护 |
| 文档导航和索引必须真实存在 | repo check |
| 文档声明必须与实现一致 | repo check |
| 新会话最小引导 | hook |

## 文件范围

本次实现预计涉及：

- `.claude/agents/tester.md`
- `skills/dev-workflow/SKILL.md`
- `.claude/skills/dev-workflow/SKILL.md`
- `docs/design-docs/tester.md`
- `docs/product-specs/agent-system.md`
- `docs/feedback/feedback-collection.md`
- `docs/design-docs/index.md`
- `docs/exec-plans/active/`
- `docs/exec-plans/index.md`
- `package.json`
- `scripts/`

## 验收标准

达到本轮最小目标时，应满足：

- `Tester` 已具备“探测验证入口 -> 执行可执行验证 -> 必要时询问用户”的明确行为定义
- `dev-workflow` 已明确 Reviewer / Tester 的阻塞规则和用户决策点
- `cc-harness` 自身具备基础一致性检查能力
- 关键文档之间不再出现明显自相矛盾
- hook 仍只承担轻量引导职责
