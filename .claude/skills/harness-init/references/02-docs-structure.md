# docs/ 目录结构模板

按项目复杂度选择合适的模板。

---

## 简单项目模板（Solo，<5 人）

```markdown
# 项目架构

> 最后更新：YYYY-MM-DD

## 系统概述

[2-3 句话描述系统做什么]

## 核心模块

| 模块 | 路径 | 职责 |
|------|------|------|
| 组件 | `src/components/` | 可复用 UI 组件 |
| 页面 | `src/pages/` | 页面级组件 |
| 工具 | `src/utils/` | 纯工具函数 |

## 技术决策

[记录重要的技术选型决策和理由]
```

---

## 中等项目模板（5-20 人）

### docs/architecture.md

```markdown
# 架构文档

> 最后更新：YYYY-MM-DD

## 系统概述

[系统是什么，解决什么问题]

## 架构图

[文字描述关键组件及关系]

```
[组件 A] → [组件 B] → [数据存储]
     ↑
[前端]  ← [API 网关]
```

## 核心模块

| 模块 | 路径 | 职责 | 边界 |
|------|------|------|------|
| 前端 | `src/` | UI 展示 | 依赖 API 层 |
| API | `api/` | 业务逻辑 | 依赖数据层 |
| 数据 | `db/` | 数据持久化 | 无外部依赖 |

## 数据流

[描述核心数据流程]

## 外部依赖

| 服务 | 用途 | 配置 |
|------|------|------|
| PostgreSQL | 主数据库 | `.env.local` 中的 `DATABASE_URL` |
| Redis | 缓存 | `.env.local` 中的 `REDIS_URL` |
```

### docs/conventions.md

```markdown
# 编码规范

> 最后更新：YYYY-MM-DD

## 代码风格

- 使用 [Prettier / Black / gofmt] 格式化
- ESLint / Pylint 无 error
- 提交前运行 lint

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `UserProfile.tsx` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量 | UPPER_SNAKE | `MAX_RETRIES` |
| 数据库表 | snake_case | `user_accounts` |

## 提交规范

```
<type>: <description>

feat:     新功能
fix:      修复
refactor: 重构
docs:     文档
test:     测试
chore:    杂务
```

## Git 规范

- feature 分支命名：`feature/<描述>`
- PR 需要 1 个 review approval
- 合并前必须通过 CI
```

### docs/testing.md

```markdown
# 测试策略

> 最后更新：YYYY-MM-DD

## 测试金字塔

```
       ┌─────────┐
       │   E2E   │     ← 少量，覆盖核心流程
      ┌──────────┐
      │Integration│    ← 中等，覆盖 API 集成
     ┌───────────┐
     │   Unit    │     ← 大量，覆盖工具函数、组件
    └───────────┘
```

## 工具

- 单元测试：[Jest / Vitest / pytest]
- 集成测试：[Supertest / Playwright]
- 覆盖要求：>80%

## 运行测试

```bash
# 单元测试
npm test

# 集成测试
npm run test:integration

# 所有测试 + 覆盖率
npm test -- --coverage
```
```

---

## 复杂项目模板（20+ 人，多团队）

在中等项目基础上，添加：

### docs/data-model.md

```markdown
# 数据模型

> 最后更新：YYYY-MM-DD

## 实体关系

```
User 1───< Account
  │
  └──< Project >────── User
          │
          └──< Task
```

## Schema

### User

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | VARCHAR(255) | 唯一，不可变 |
| created_at | TIMESTAMP | 创建时间 |

## 迁移规范

- 使用版本化迁移（例：Flyway / Alembic）
- 每个迁移原子提交
- 禁止删除已有字段（仅废弃）
```

### docs/deployment.md

```markdown
# 部署流程

> 最后更新：YYYY-MM-DD

## 环境

| 环境 | 触发 | 预览 |
|------|------|------|
| `dev` | PR push | Vercel Preview |
| `staging` | main merge | staging.example.com |
| `prod` | 手动发布 | example.com |

## 部署步骤

1. 创建 release branch：`git checkout -b release/v1.2.3`
2. 更新 CHANGELOG.md
3. 打标签：`git tag v1.2.3`
4. 合并到 main
5. 触发生产部署

## 回滚

```bash
git revert <commit-sha>
git push
```
```

### docs/decisions/（ADR 目录）

```
docs/decisions/
├── 001-chose-postgresql.md
├── 002-api-versioning-strategy.md
└── 003-authentication-method.md
```

ADR 模板：

```markdown
# ADR-001: PostgreSQL 选型

日期：YYYY-MM-DD
状态：已接受

## 背景

我们需要为项目选择主数据库。

## 决策

使用 PostgreSQL 15。

## 理由

- 支持 JSON 类型，适合灵活 schema
- 成熟的生态和工具链
- 团队已有使用经验

## 后果

- 积极：支持复杂查询
- 消极：需要管理数据库迁移
```
