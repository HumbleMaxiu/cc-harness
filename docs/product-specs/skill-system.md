# Product Spec — Skill System

> **Domain：** skill-system

## 目标

提供一套 Skill 创作和维护工具，让开发者能够创建符合 cc-harness 规范的 Skills，并通过安装脚本投放到 Claude Code 或 Codex 项目。

## 用户可见行为

### `/skill-creator` Skill

用户运行 `/skill-creator` 创建新 Skill，引导式完成：

1. 定义 Skill 名称和描述
2. 编写 SKILL.md 主文件
3. 可选：添加 references/ 和 scripts/
4. 通过 `install.sh` 验证该 Skill 能被安装到目标 host

### Skill 结构规范

通用结构、frontmatter、required sections、output contract、pressure scenarios 和 audit severity 以 [cc-harness Skill Standard](../references/skill-standard.md) 为事实源。

```
skills/<skill-name>/
├── SKILL.md          # 必需：入口文档
├── references/       # 可选：按需读取的 LLM context、source attribution、pressure scenarios
├── scripts/          # 可选：可执行 helper
└── assets/           # 可选：模板、图片、字体、样例资源
```

### SKILL.md 格式

```yaml
---
name: <skill-name>
description: <能力说明 + 触发场景>
---

# <Skill 名称>

[执行说明]
```

`description` 是 skill activation 的关键入口，必须包含触发场景，不能只是泛泛描述。

## 已内置 Skills

| Skill | 描述 |
|-------|------|
| brainstorming | 创造性需求和设计探索 |
| pm-orchestrator | PM 总控层，负责阶段控制、skill 分配、失败回流和 gate 编排 |
| plan-review | 实现前的只读计划审核 gate，由 PM 按风险调度 |
| follow-goal | 长跑任务的 durable objective、停止条件和 checkpoint 执行协议 |
| architect | 计划检查和文档影响判断 |
| challenger | 对抗式验证 |
| developer | TDD 实现 |
| reviewer | 代码质量和安全审查 |
| tester | 验证入口探测和测试执行 |
| feedback-curator | feedback memory 维护 |
| feedback | 用户反馈提交入口 |
| feedback-query | feedback 历史查询与摘要 |
| plan-persist | 轻量 planning 持续化与恢复锚点 |
| harness-help | 根入口索引与场景快速参考 |
| harness-audit | harness 健康检查 |
| harness-guide | 按场景推荐 skill / workflow |
| harness-quality-gate | 交付前质量门禁 |
| harness-setup | Harness 脚手架生成与更新 |
| skill-creator | Skill 创作工具 |
| skill-audit | Skill Standard 审计入口 |
| writing-plans | 多步骤计划编写 |
| exa-search | 神经搜索 |
| using-brainstorming | brainstorming 前置引导 |

### `/feedback` Skill

用户运行 `/feedback` 时，应允许直接使用自然语言表达纠正、偏好、请求或投诉，并由 Skill：

1. 将反馈分类为 `correction` / `preference` / `request` / `complaint`
2. 生成 `user-feedback.md` 所需的结构化记录
3. 立即推动当前任务按该反馈执行
4. 在需要时提示是否应升级为 `prevents-recurrence`

### Harness 根入口 Skills

`cc-harness` 应提供一组产品级根入口，让用户先按意图找到正确 workflow，而不是要求用户先理解全部内部 skill：

1. `/harness-help`：显示命令索引、根入口和高频场景
2. `/harness-audit`：读取质量与结构信号，输出健康检查
3. `/harness-guide`：根据任务场景推荐 skill / workflow
4. `/harness-quality-gate`：在交付或提交前运行质量门禁

这四个 Skill 的目标不是替代具体 workflow，而是让用户更容易发现和进入已有能力。

### `/plan-persist` Skill

用户运行 `/plan-persist` 时，应围绕现有 `docs/exec-plans/active/`、`Run Trace` 和 `Skill Workflow Record` 提供轻量状态持续化，而不是新建第二套 planning 文件体系。

### Memory 驱动的 Skill Promotion

当 feedback 或 recurrence 中出现稳定、重复、可复用的 workflow 时，系统应允许通过 `Skill Promotion Candidate` 把记忆层问题升级为 project-local skill。

推荐分工：

1. `/feedback-query`：查看 candidate
2. `/skill-creator`：将 candidate 落成真正的 skill

### 三方 Skill 引入

专项能力类 skill 可以优先复用或改编 GitHub 上已有实现，但必须放入统一 `skills/` 目录，并记录 source attribution、license、imported commit 和 local changes。

三方来源 skill 必须满足 [cc-harness Skill Standard](../references/skill-standard.md)，并适配 cc-harness output contract，能被 `/pm-orchestrator` 和 `/harness-quality-gate` 消费。详细设计见 [third-party-skill-integration.md](../design-docs/third-party-skill-integration.md)。

### Skill 标准检查

开发者可以手动运行：

```bash
node scripts/checks/skill-standard.mjs
```

该检查不作为每次 quality gate 的默认强制项。PM orchestrator 应在以下场景选择性调度：

1. 创建或重大修改 skill
2. 引入三方 skill
3. feedback / recurrence 生成 skill
4. 用户或 PM orchestrator 显式要求 skill health check

### Installable Runtime Portability

用户创建普通 repo-local skill 时，不强制做额外 portability checklist。

当 skill 需要安装到 `.codex/skills` / `.claude/skills`、跨项目复用、分发给其他用户，或被 PM gate / review pack / installer 调度时，必须满足：

1. 运行必需 references 放在 `skills/<skill-name>/references/`
2. 运行必需 scripts 放在 `skills/<skill-name>/scripts/`
3. 运行必需 assets 放在 `skills/<skill-name>/assets/`
4. repo-level `docs/` 和顶层 `scripts/` 只能作为 supplemental source
5. 无法内置时必须写明 fallback / blocked 条件
6. 创建或重大修改后运行 install smoke check

### `/skill-audit` Skill

用户运行 `/skill-audit` 时，应围绕 [cc-harness Skill Standard](../references/skill-standard.md) 输出结构化审计结果。

`/skill-audit` 与 `/skill-creator` 的分工：

1. `/skill-creator` 负责创建、改造、重构 skill，并在必要时执行自检
2. `/skill-audit` 负责独立审计、解释检查结果、区分 `ERROR` / `WARNING` / strict gate
3. PM orchestrator 可以在创建或修改 skill、引入三方 skill、feedback-generated skill、显式 skill health check 时调度 `/skill-audit`

默认行为：

- 默认运行 `node scripts/checks/skill-standard.mjs`
- 需要 machine-readable 结果时运行 `--json`
- 只有 PM gate 或用户明确要求时使用 `--strict`
- 无 `ERROR` 但存在历史迁移 warnings 时输出 `WARN`，不误报为 `FAIL`

### Review Packs

Review pack 是可被 PM orchestrator 按 capability 调度的专项 review / verification skill。首批候选 capability、source project、license 状态和 wrapper 需求记录在 [Review Pack Registry](../references/review-pack-registry.md)。

## 相关文档

- [docs/design-docs/core-beliefs.md](../design-docs/core-beliefs.md)
- [docs/design-docs/third-party-skill-integration.md](../design-docs/third-party-skill-integration.md)
- [docs/references/skill-standard-research.md](../references/skill-standard-research.md)
- [docs/references/skill-standard.md](../references/skill-standard.md)
- [docs/references/skill-pressure-scenarios.md](../references/skill-pressure-scenarios.md)
- [docs/references/review-pack-registry.md](../references/review-pack-registry.md)
- [docs/install-ai.md](../install-ai.md)
