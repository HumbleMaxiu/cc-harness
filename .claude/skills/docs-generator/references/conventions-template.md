# docs/conventions.md 模板

> 基于 OpenAI Harness Engineering 和 Stripe Minions Blueprint 模式

---

## 模板结构

```markdown
# 编码规范

> 最后更新：YYYY-MM-DD
> 作者：[名字]

## 1. 代码风格

### 1.1 格式化
- 使用 [Prettier / Black / gofmt / rustfmt] 格式化
- ESLint / Pylint / golangci-lint 无 error
- 提交前自动运行 formatter

### 1.2 Lint 规则
[项目使用的 lint 规则，如 ESLint rules：
- no-var: 禁止 var
- prefer-const: 优先使用 const
- no-unused-vars: 禁止未使用变量
]

### 1.3 Type Safety
- [TypeScript: strict mode / Python: mypy --strict]
- 禁止 `any` / `object` 类型
- 禁止类型断言绕过类型检查

## 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件/类 | PascalCase | `UserProfile.tsx` / `class UserService` |
| 函数/方法 | camelCase | `getUserById()` |
| 变量 | camelCase | `isLoading` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 文件 | kebab-case / snake_case | `user-profile.ts` / `user_service.py` |
| 数据库表 | snake_case | `user_accounts` |
| API 路由 | kebab-case | `/user-profiles` |

## 3. 提交规范

### 3.1 Commit Message 格式
```
<type>: <简短描述>

feat:     新功能
fix:      修复 bug
refactor: 重构（不改变功能）
docs:     文档更新
test:     添加/修改测试
chore:    杂务（依赖更新、构建配置）
perf:     性能优化
ci:       CI/CD 配置
```

### 3.2 分支命名
```
feature/<描述>      # 新功能
fix/<描述>          # Bug 修复
refactor/<描述>     # 重构
docs/<描述>         # 文档
```

## 4. 目录与模块组织

### 4.1 层级约束
[来自 OpenAI Harness Engineering 的层级依赖规则，如：
Types → Config → Repo → Service → Runtime → UI
]

```
src/
├── types/           # 类型定义（无依赖）
├── config/          # 配置（依赖 types）
├── repos/          # 数据访问层（依赖 types + config）
├── services/       # 业务逻辑（依赖 repos）
├── runtime/       # 运行时/控制器（依赖 services）
└── ui/             # UI 层（依赖 services）
```

### 4.2 禁止导入模式
- ❌ UI 层禁止直接导入 Repo 层
- ❌ Service 层禁止直接操作数据库
- ❌ 禁止循环依赖

## 5. 错误处理

### 5.1 错误类型
```typescript
// 示例（按实际语言调整）
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// 用法
throw new AppError('User not found', 'USER_NOT_FOUND', 404);
```

### 5.2 错误传播
- 底层函数返回 Result/Either 类型
- 中间层记录上下文后传播
- 顶层统一格式化错误响应

## 6. API 设计规范

### 6.1 REST 约定
- URL 使用名词，非动词：`/users` 而非 `/getUsers`
- 使用 HTTP 方法语义：GET（查询）、POST（创建）、PUT（完整更新）、PATCH（部分更新）、DELETE（删除）
- 使用 kebab-case：`/user-profiles`

### 6.2 响应格式
```json
{
  "data": { },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20
  }
}
```

## 7. 安全规范

### 7.1 输入验证
- 所有外部输入必须验证（使用 Zod / pydantic / JSON Schema）
- 禁止直接拼接 SQL（使用参数化查询）
- 禁止在日志中记录敏感信息

### 7.2 秘钥管理
- 所有秘钥通过环境变量注入
- 禁止硬编码秘钥
- `.env` 文件不提交版本控制
```

---

## 来源与优先级

规范来源优先级：
1. **用户明确要求** > **从现有代码推断** > **不生成**
2. 禁止凭空编造不存在于代码库中的规范
3. 命名规范从现有代码提取，不强制特定风格
