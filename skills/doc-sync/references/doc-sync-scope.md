# Doc Sync Scope

## 目标

定义 `/doc-sync` 第一版默认覆盖的文档层，避免 Skill 漫无边界地处理“所有文档工作”。

## 默认覆盖范围

- 项目入口与导航
  - `AGENTS.md`
  - 相关 index 页面
- 项目级架构与原则
  - `ARCHITECTURE.md`
  - 必要的项目级规范文档
- 任务与设计文档
  - `docs/design-docs/`
  - `docs/exec-plans/`
- 领域规格
  - `docs/product-specs/`
- 记忆与反馈规则
  - `docs/memory/`
  - `docs/feedback/`

## 默认不覆盖

- 与当前变更无关的历史文档重写
- 营销、宣传或外部发布文案
- 大规模知识库重构

## 范围判定规则

优先检查与 `files_touched`、`change_summary`、`docs_impact_matrix` 直接相关的文档。

不要因为某个目录存在，就把整个目录全部重写。
