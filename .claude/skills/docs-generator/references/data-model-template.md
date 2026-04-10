# docs/data-model.md 模板

> 适用于有数据库模型或数据结构的项目

---

## 模板结构

```markdown
# 数据模型

> 最后更新：YYYY-MM-DD
> 作者：[名字]

## 1. 实体关系

### 1.1 ER 图
```
[实体 A] 1 ─────< N [实体 B]
  │              │
  │              │
  N ─────> 1 [实体 C]
```

### 1.2 命名规范
- 表名：复数名词，snake_case（如 `user_accounts`）
- 列名：snake_case（如 `created_at`）
- 外键：`{table}_id`（如 `user_id`）

## 2. 数据表

### 2.1 [表名]

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| name | varchar(255) | NOT NULL | 名称 |
| created_at | timestamp | NOT NULL | 创建时间 |
| updated_at | timestamp | NOT NULL | 更新时间 |

**索引：**
- `idx_{table}_{column}` on `{column}`

**约束：**
- `uq_{table}_{column}` UNIQUE ({column})

## 3. 枚举类型

### 3.1 [枚举名]
| 值 | 说明 |
|----|------|
| PENDING | 待处理 |
| ACTIVE | 激活 |
| INACTIVE | 未激活 |

## 4. 迁移策略

### 4.1 迁移原则
- 使用版本化迁移（如 Flyway、Liquibase）
- 每个迁移必须可逆
- 迁移前备份数据
- 生产环境必须经过评审

### 4.2 迁移命令
```bash
# 本地运行迁移
npm run db:migrate

# 回滚上一版本
npm run db:rollback

# 检查状态
npm run db:status
```

## 5. 数据完整性

### 5.1 约束
- 所有表必须有 `created_at` 和 `updated_at`
- 软删除使用 `deleted_at` 字段
- UUID 主键优于自增 ID

### 5.2 审计字段
| 字段 | 类型 | 说明 |
|------|------|------|
| created_by | uuid | 创建人 |
| updated_by | uuid | 更新人 |
| deleted_at | timestamp | 软删除时间 |
```

---

## 适用范围

本模板适用于有持久化存储的项目。如项目无数据库层，跳过此文档。
