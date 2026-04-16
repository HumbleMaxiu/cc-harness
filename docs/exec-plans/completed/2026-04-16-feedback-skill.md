# Feedback Skill Plan

**日期：** 2026-04-16
**状态：** COMPLETED

## 目标

新增一个用户可直接调用的根 Skill：`/feedback`，让用户能用自然语言提交项目反馈，而不是只能手动描述后再由 agent 临时整理。

## 背景

当前仓库虽然已有 `feedback-query`，但它同时承载“查询”和“记录”两类动作，且“记录新反馈”的入口仍偏手工，存在几个问题：

- 用户第一直觉是“我要提 feedback”，而不是“我要 query feedback”
- 记录格式暴露了过多内部字段，不像一个顺手的用户入口
- `AGENTS.md`、guide、规格文档里缺少一个清晰、可发现的反馈提交入口

本轮实现要把“提反馈”从“查反馈”中拆出来，形成单独的顶级能力。

## 实施范围

1. 新增 `skills/feedback/` 与 `.claude/skills/feedback/`
2. 调整 `feedback-query` 为查询/管理定位，不再作为主要提交入口
3. 同步 `AGENTS.md`、guide、feedback 规则、产品规格、设计文档索引
4. 记录本次用户反馈到 `docs/memory/feedback/user-feedback.md`

## 实施结果

1. 新增 `feedback` 顶级 Skill，并同步到 `skills/`、`.claude/skills/`、`.codex/skills/`
2. 将 `feedback-query` 收敛为查询/摘要入口，避免与提交入口混淆
3. 更新 `AGENTS.md`、guide、feedback 规则、产品规格和设计文档索引
4. 将本次需求作为用户反馈追加到 `docs/memory/feedback/user-feedback.md`

## 验证

- `node scripts/checks/harness-consistency.js`
- 手工检查 `skills/feedback/`、`.claude/skills/feedback/`、`.codex/skills/feedback/` 文案一致
- 手工检查导航文档能发现 `/feedback`
