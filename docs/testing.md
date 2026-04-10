# 测试策略

> 最后更新：2026-04-09
> 作者：Claude Code Harness Plugin

## 1. 测试金字塔

```
         ┌─────────┐
         │   E2E   │     ← 少量，覆盖核心用户流程
        ┌──────────┐
        │Integration│    ← 中等，覆盖 Skill 编排和文件生成
       ┌───────────┐
       │   Unit    │     ← 大量，覆盖工具函数、模板渲染
      └───────────┘
```

## 2. Skill 测试框架

### 2.1 三层测试

| 层级 | 类型 | 运行频率 | 内容 |
|------|------|----------|------|
| **L1** | 确定性检查 | 每次 commit | 文件存在性、frontmatter 验证、schema 检查 |
| **L2** | 模型评估 | 每次 PR | AI 作为裁判评估 Skill 输出质量 |
| **L3** | 统计验证 | 每周 | 通过率方差测量 |

### 2.2 L1 确定性测试
```bash
# 运行 L1 测试
npm test

# 验证 Skill 结构
./scripts/validate-skill.sh <skill-name>

# 检查必需文件
- SKILL.md 存在且有 frontmatter
- references/ 目录结构正确
- evals/evals.json 格式正确
```

### 2.3 L2 模型评估
```bash
# 运行 LLM 评估
npm run test:llm-judge

# 评估指标：
# - 功能正确性：输出符合 SKILL.md 描述？
# - 文档质量：生成的文档格式正确？
# - 一致性：多次运行输出一致？
```

### 2.4 L3 统计验证
```bash
# 运行统计验证
npm run test:stat

# 检查：
# - 通过率标准差 < 5%
# - 错误类型分布稳定
```

## 3. Skill 开发测试流程

### 3.1 开发循环
```
创建 Skill 模板
      ↓
添加 evals/ 测试用例
      ↓
运行 L1 验证
      ↓
运行 L2 模型评估
      ↓
迭代改进
      ↓
通过所有测试后同步到 skills/
```

### 3.2 测试文件组织
```
<skill-name>/
├── evals/
│   ├── evals.json      # 测试用例定义
│   └── outputs/         # 测试输出（gitignore）
└── scripts/
    └── validate.sh     # 验证脚本
```

## 4. AI 生成代码测试

### 4.1 生成的 SKILL.md 测试
- 验证 YAML frontmatter 正确
- 验证必需字段存在
- 验证触发短语非空

### 4.2 生成的文档测试
- 验证文件路径正确
- 验证 Markdown 格式
- 验证内容完整性

## 5. CI 中的测试

### 5.1 CI 流程
```
代码提交
    ↓
L1: 本地验证（<5 秒）
    ↓
L2: 模型评估（按需，PR 时触发）
    ↓
L3: 统计验证（按周）
    ↓
人类 Review → Merge
```

### 5.2 CI 测试失败处理
- 最多 2 轮自动重试
- 2 轮后仍失败 → 交给人类处理
- 不可修复的失败 → 创建 ticket

## 6. 覆盖率要求

| 指标 | 目标 |
|------|------|
| SKILL.md 字段覆盖率 | 100% |
| 模板变量覆盖率 | > 90% |
| 错误处理覆盖率 | 100% |

## 7. Mock 规范

### 7.1 使用场景
- 单元测试使用 Mock 隔离外部依赖
- 不真正调用 Exa API（使用 mock 数据）
- 不真正创建 Notion 页面（使用 mock）

### 7.2 Mock 示例
```typescript
// Mock Exa API
const mockExaResponse = {
  results: [{ title: 'Test', url: 'https://example.com' }],
};

// Mock Notion API
const mockNotionPage = { id: 'test-id', url: 'https://notion.so/test' };
```
