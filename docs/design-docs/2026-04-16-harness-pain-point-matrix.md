# Harness Pain Point Matrix

> **背景：** 基于本地对标仓库 `/Users/masiyuan/Downloads/harness-main` 的产品化做法，整理 `cc-harness` 当前面向用户的核心痛点、已实现能力、缺口与下一步增强方向。

## 目的

这份文档不定义某一个单独功能，而是作为对外叙事和内部路线图之间的桥：

- 对外：说明 `cc-harness` 解决的不是“多几个 skill”，而是一组稳定重复出现的协作失败模式
- 对内：把 roadmap 从“补哪个文件”提升为“补哪类能力缺口”

## 痛点矩阵

| 痛点 | 当前解法 | 强度 | 仍有缺口 | 下一步 |
|------|----------|------|----------|--------|
| 先写代码后思考 | `/brainstorming` + `/writing-plans` + `AGENTS.md` 中的 hard gate | 强 | 用户仍可能跳过入口，缺少更显眼的“从哪里开始”产品入口 | 继续强化 `/harness-help`、`/harness-guide` 的默认推荐路径 |
| 计划漂移 | `docs/exec-plans/active/` + Run Trace + `/plan-persist` + `UserPromptSubmit/PreToolUse/PostToolUse/Stop` hooks | 中强 | 目前提醒为主，尚未对“计划外编辑”做更强的 drift detection | 增加 plan-vs-files/change-set 检测与更明确的 remediation 输出 |
| 验证缺失 | `/dev-workflow` 的 Reviewer/Tester 闭环 + `/harness-quality-gate` + `/harness-audit` + `QUALITY_SCORE.md` | 中强 | 复杂 claim 过去缺少独立挑战角色，跨外部 API/行为证据仍容易松动 | 把 Challenger 更稳定接入执行流，并继续扩展 audit 信号 |
| 文档腐坏 | `/doc-sync` + `docs/*/index.md` + `scripts/checks/harness-consistency.js` | 强 | 目前更擅长检测存在性与索引一致性，对“文档过时但结构仍在”的问题还不够强 | 增加 freshness / ownership / workflow completeness 信号 |
| 反馈无法沉淀 | `/feedback` + feedback memory + recurrence 规则 + `Skill Promotion Candidate` | 中强 | 已能记录与提炼，但“从 recurring issue 到新 skill”还偏人工触发 | 增加 skill candidate 汇总视图和更直接的 `/skill-creator` 接力 |
| 恢复困难 | SessionStart memory 注入 + Run Trace + `/plan-persist` hooks + `docs/memory/index.md` | 中强 | 恢复信息已存在，但不同层级信息的优先级还需要更产品化地解释给用户 | 在 guide/help 中继续强化 resume 路径，并补更清晰的恢复 checklist |

## 当前能力地图

### Root Entries

- `/harness-help`：给出命令索引和高频入口
- `/harness-guide`：根据场景推荐 skill 或 workflow
- `/harness-audit`：读取仓库信号并输出结构化健康检查
- `/harness-quality-gate`：交付前执行质量门禁

### Execution Continuity

- `/brainstorming`：需求与方案探索
- `/writing-plans`：复杂任务计划
- `/plan-persist`：小任务和 bugfix 的轻量持续 planning
- hooks：在提示、工具前后与停止点持续回注 active plan / trace

### Multi-role Verification

- `Architect`：计划与文档一致性
- `Developer`：实现与 TDD
- `Reviewer`：代码质量与风险
- `Tester`：验证入口与测试
- `Challenger`：对计划、claim、外部 API 假设进行对抗式验证
- `Feedback Curator`：整理反馈、更新 memory、推动 recurrence 提炼

### Knowledge Retention

- `docs/memory/feedback/user-feedback.md`
- `docs/memory/feedback/agent-feedback.md`
- `docs/memory/feedback/prevents-recurrence.md`
- `Skill Promotion Candidate` 升级路径

## 对外表达原则

对用户解释 `cc-harness` 时，优先说：

1. 你现在遇到的是哪类协作失败模式
2. 当前仓库里已有哪条标准路径能处理它
3. 哪些地方已经做强，哪些地方仍在演进

不优先说：

- 我们有多少个 skill
- 文档目录有多少层
- 规则列表有多长

## 与路线图的关系

这份矩阵对应当前增强路线图的三个层次：

- P0：可发现性和 planning 连续性
- P1：claim challenge 与健康检查
- P2：经验复用与产品叙事

后续如果新增新的核心痛点，应该优先更新这里，再决定是否扩展到 `README.md`、`docs/HARNESS_METHODOLOGY.md` 或 `docs/PLANS.md`。
