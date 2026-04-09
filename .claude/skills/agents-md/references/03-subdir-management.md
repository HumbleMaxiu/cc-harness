# 子目录 AGENTS.md 管理与索引更新

当项目规模增长时，需要在子目录创建专门的 AGENTS.md 文件。

## 何时创建子目录 AGENTS.md

| 条件 | 是否创建 |
|------|----------|
| 子模块有独立职责和边界 | ✅ |
| 子模块有特有的代码约定 | ✅ |
| 子模块有 5+ 个独特文件 | ✅ |
| 多团队协作，不同团队负责不同模块 | ✅ |
| 子模块可能独立被 Agent 处理 | ✅ |

| 条件 | 避免创建 |
|------|----------|
| 只是为了更细的文档 | ❌ |
| 子模块非常简单，一句话能说清 | ❌ |
| 子模块约定与根目录完全一致 | ❌ |

---

## 子目录 AGENTS.md 原则

### 1. 不重复根目录内容

子目录 AGENTS.md **继承**根目录 AGENTS.md 的所有约定，只需补充本模块特有的内容。

```markdown
# 认证模块

## 与根目录 AGENTS.md 的关系

本模块是 [项目名] 的一部分。根目录 `AGENTS.md` 中的通用约定仍然适用：
- 必须使用中文输出
- 遵循 TypeScript 类型规范
- 测试覆盖率要求 >80%

**本页只记录本模块特有的约定。**
```

### 2. 专注模块边界

```markdown
## 模块边界

- **输入**：`src/auth/types.ts` 定义的 `AuthContext`
- **输出**：认证后的 `User` 对象
- **依赖**：外部 IdP（Google/GitHub OAuth）
```

### 3. 简短原则

子目录 AGENTS.md **≤ 100 行**，只需包含：
- 模块职责（1 句话）
- 与根目录的关系（1-2 句）
- 模块特有约定（3-5 条）
- 关键文件索引

---

## 根目录索引更新

当创建子目录 AGENTS.md 时，**必须**同时更新根目录 AGENTS.md 的索引。

### 添加到 "Submodules" 章节

```markdown
## 子模块

| 模块 | 路径 | 职责 |
|------|------|------|
| 认证 | `packages/auth/AGENTS.md` | 用户登录、OAuth、JWT |
| 数据库 | `packages/db/AGENTS.md` | 数据访问层、Schema |
| API | `apps/api/AGENTS.md` | REST API 路由、中间件 |
```

或添加到 "文档地图"：

```markdown
| 认证模块详情 | `packages/auth/AGENTS.md` |
| 数据库约定 | `packages/db/AGENTS.md` |
```

---

## 操作流程

### 步骤 1：在子目录创建 AGENTS.md

```bash
# 创建目录（如不存在）
mkdir -p packages/auth

# 创建文件
cat > packages/auth/AGENTS.md << 'EOF'
# 认证模块

> 用户认证和授权

## 模块职责
[1-2 句话]

## 特有约定
1. [约定]
2. [约定]

## 关键文件
| 文件 | 用途 |
|------|------|
| `index.ts` | 导出入口 |
| `provider.ts` | 认证提供者 |
EOF
```

### 步骤 2：更新根目录 AGENTS.md

读取根目录 AGENTS.md，找到 "Submodules" 或 "文档地图" 章节，添加条目。

### 步骤 3：验证

- [ ] 子目录 AGENTS.md 行数 ≤ 100
- [ ] 根目录 AGENTS.md 索引已更新
- [ ] 子目录引用了根目录关系说明

---

## 示例

### 原始根目录 AGENTS.md 片段

```markdown
## 目录结构

```
├── packages/
│   ├── auth/           # 认证模块
│   └── billing/        # 计费模块
└── apps/
    └── web/            # Web 应用
```

## 文档地图

| 主题 | 文件 |
|------|------|
| 架构 | `docs/architecture.md` |
| API | `docs/api.md` |
```

### 添加 `packages/auth/AGENTS.md` 后

```markdown
## 文档地图

| 主题 | 文件 |
|------|------|
| 架构 | `docs/architecture.md` |
| API | `docs/api.md` |
| 认证模块详情 | `packages/auth/AGENTS.md` |  ← 新增
```

---

## 删除子目录 AGENTS.md

如果子模块被删除或合并，**必须**：

1. 删除子目录 AGENTS.md 文件
2. 从根目录 AGENTS.md 移除对应索引条目
3. 提交变更：`refactor: remove subdir AGENTS.md for [module]`

---

## 多层级目录结构

对于深层嵌套的目录，只在有意义的层级创建 AGENTS.md：

```
root/
├── AGENTS.md                    ✅ 根目录
├── packages/
│   ├── auth/
│   │   ├── AGENTS.md           ✅ 子模块
│   │   ├── providers/
│   │   │   ├── AGENTS.md       ❌ 不需要，太深
│   │   │   └── google.ts
│   │   └── strategies/
│   │       └── AGENTS.md       ❌ 不需要
```

**原则**：只在 Agent 可能会**直接导航到**的层级创建 AGENTS.md。
