# 编码规范

> 最后更新：2026-04-09
> 作者：Claude Code Harness Plugin

## 1. 代码风格

### 1.1 格式化
- 使用 Prettier 格式化（`.prettierrc` 已配置）
- ESLint 无 error
- 提交前自动运行 formatter

### 1.2 Type Safety
- TypeScript strict mode
- 禁止 `any` 类型
- 禁止类型断言绕过类型检查

## 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Skill 目录 | kebab-case | `skill-creator` |
| SKILL.md | 全大写 | `SKILL.md` |
| 函数/方法 | camelCase | `generateSkill()` |
| 变量 | camelCase | `isLoading` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 文件 | kebab-case | `agent-runner.ts` |
| Markdown 标题 | PascalCase 或自然语言 | `# Architecture` 或 `# 架构文档` |

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
```

### 3.2 分支命名
```
feat/<描述>      # 新功能
fix/<描述>       # Bug 修复
refactor/<描述>  # 重构
docs/<描述>      # 文档
skill/<name>     # Skill 开发
```

## 4. Skill 开发规范

### 4.1 Skill 目录结构
```
<skill-name>/
├── SKILL.md           # 必需：Skill 定义
├── references/        # 参考文档模板
│   └── *.md
├── evals/             # 评估用例
│   └── evals.json
└── scripts/           # 辅助脚本（如有）
    └── *.sh
```

### 4.2 SKILL.md 必需字段
```yaml
---
name: <skill-name>
description: <一句话描述>
triggers:
  - <触发短语>
---
```

### 4.3 禁止模式
- ❌ 禁止在 `skills/` 目录直接开发（必须通过 `.claude/skills/` 中转）
- ❌ 禁止创建缺少 YAML frontmatter 的 SKILL.md
- ❌ 禁止提交未通过 evals/ 测试的 Skill
- ❌ 禁止在文档地图中引用 `.claude/` 等内部开发路径

## 5. 错误处理

### 5.1 错误传播
- 底层函数返回 Result/Either 类型
- 中间层记录上下文后传播
- 顶层统一格式化错误响应

## 6. AGENTS.md 规范

### 6.1 渐进披露原则
- AGENTS.md 是入口索引，最多 300 行
- docs/ 是详细内容，任何超过 300 行的文档都应拆分
- 从项目根目录读取 AGENTS.md 作为主索引

### 6.2 文档地图
AGENTS.md 必须包含 Documentation Map 部分：
```
## Documentation Map
- [docs/architecture.md](docs/architecture.md) - 系统架构
- [docs/conventions.md](docs/conventions.md) - 编码规范
```

## 7. 安全规范

### 7.1 秘钥管理
- 所有秘钥通过环境变量注入
- 禁止硬编码秘钥
- `.env` 文件不提交版本控制

### 7.2 敏感信息
- 禁止在日志中记录敏感信息
- API 响应中过滤敏感字段
