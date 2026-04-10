# docs/testing.md 模板

> 基于 Stripe Minions 三层反馈循环 + AI Agent 测试框架

---

## 模板结构

```markdown
# 测试策略

> 最后更新：YYYY-MM-DD
> 作者：[名字]

## 1. 测试金字塔

```
         ┌─────────┐
         │   E2E   │     ← 少量，覆盖核心用户流程
        ┌──────────┐
        │Integration│    ← 中等，覆盖 API 集成和模块协作
       ┌───────────┐
       │   Unit    │     ← 大量，覆盖工具函数、组件、边界
      └───────────┘
```

## 2. 测试工具

| 层级 | 工具 | 用途 |
|------|------|------|
| Unit | [Jest / Vitest / pytest / go test] | 函数/组件测试 |
| Integration | [Supertest / Playwright / Testcontainers] | API / 模块集成 |
| E2E | [Playwright / Cypress / Detox] | 关键用户流程 |

## 3. 运行命令

```bash
# 单元测试
npm test

# 带覆盖率
npm test -- --coverage

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e

# 所有测试
npm run test:all
```

## 4. 测试文件组织

```
src/
├── components/
│   └── Button.tsx
└── __tests__/
    └── components/
        └── Button.test.tsx    ← 单元测试与被测文件同目录

# 或集中式：
tests/
├── unit/
├── integration/
└── e2e/
```

## 5. AI Agent 测试规范

> 基于 Harness Engineering 的 AI Agent 测试框架

### 5.1 三层测试

| 层级 | 类型 | 运行频率 | 内容 |
|------|------|----------|------|
| **L1** | 确定性检查 | 每次 commit | 结构属性、类型检查、lint |
| **L2** | 模型评估 | 每次 PR | AI 作为裁判评估输出质量 |
| **L3** | 统计验证 | 每周 | 通过率方差测量 |

### 5.2 AI 生成代码测试要求
- AI 生成的每个功能必须有对应测试
- 测试覆盖率 > 80%（行覆盖率）
- 关键路径必须有边界测试
- 禁止提交 AI 生成的无测试代码

### 5.3 LLM-as-Judge 评估（可选）
```bash
# 运行 LLM 评估
npm run test:llm-judge

# 评估指标：
# - 功能正确性：输出符合规格？
# - 代码质量：符合项目规范？
# - 安全性：无注入风险？
```

## 6. CI 中的测试

> 基于 Stripe Minions 反馈循环

```
代码提交
    ↓
L1: 本地 lint（<5 秒）
    ↓
L2: 选择性 CI 测试（相关测试集）
    ↓
L3: 完整测试套件（按需）
    ↓
人类 Review → Merge
```

### 6.1 CI 测试失败处理
- 最多 2 轮自动重试（Stripe Minions 模式）
- 2 轮后仍失败 → 交给人类处理
- 不可修复的失败 → 创建 ticket

## 7. Mock 与 Spy 规范

### 7.1 使用原则
- 单元测试使用 Mock 隔离外部依赖
- 集成测试使用真实依赖（Testcontainers）
- E2E 测试使用真实环境

### 7.2 常见 Mock 对象
```typescript
// 示例（按实际语言调整）
// Mock 数据库
const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
};

// Mock API
jest.mock('../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
```

## 8. 覆盖率要求

| 指标 | 目标 |
|------|------|
| 行覆盖率 | > 80% |
| 分支覆盖率 | > 70% |
| 函数覆盖率 | > 90% |
| 关键路径 | 100% |

## 9. 测试数据管理

- 使用 Factory / Fixture 生成测试数据
- 避免硬编码数据库记录 ID
- 测试数据在每个测试前重置
- 敏感数据使用匿名化数据
```

---

## 测试驱动开发（TDD）

> 基于用户编码风格推断

| 偏好 | 适用场景 | 约束 |
|------|----------|------|
| TDD | 重构/新模块 | 先写测试，再实现 |
| 按需测试 | 快速迭代 | 功能后补充测试 |
| 混合 | 常规开发 | 新功能 TDD，修复 BUG 按需 |

如用户未指定，默认采用**混合**策略。
