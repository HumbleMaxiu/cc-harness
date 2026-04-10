# 三大支柱：Context、Constraints、Entropy

> 来源：[AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/)、[OpenAI Codex](https://gist.github.com/celesteanders/21edad2367c8ede2ff092bd87e56a26f)

---

## 总览

Harness Engineering 的所有投入都落在三大支柱之一：

| 支柱 | 含义 | Agent 体验 |
|------|------|-----------|
| **Legibility**（可读性） | Repo 是自己的文档 | Agent 通过阅读代码库定位，而非被告知 |
| **Mechanical Enforcement**（机械执行） | 约束由工具执行，不由指令执行 | 特定类别错误不可能发生 |
| **Entropy Management**（熵管理） | 随时间推移防止质量下降 | 会话之间质量稳定 |

---

## 支柱 1：Legibility（可读性）

### 核心原则

代码库即文档。Agent 通过阅读代码库自主定位，而非依赖外部说明。

### Agent 体验

```
传统方式：
用户说"修改用户模块" → Agent 问"用户模块在哪？" → 等待回答

Legibility 方式：
Agent 读取目录结构 → 发现 src/users/ → 直接定位并修改
```

### Legibility 的实现

| 实践 | 作用 |
|------|------|
| 清晰目录命名 | `src/users/` > `src/module1/` |
| 一致文件模式 | `UserService.ts` > `svc.js` |
| 依赖层级可见 | import 图展示模块关系 |
| 显式导出 | `index.ts` 统一导出公共接口 |

### 代码库即文档的具体做法

**1. 目录结构表达架构**
```
src/
├── types/           # 类型定义（无依赖）
├── config/          # 配置（依赖 types）
├── repos/          # 数据访问（依赖 types + config）
├── services/        # 业务逻辑（依赖 repos）
├── runtime/         # 运行时（依赖 services）
└── ui/             # UI 层（依赖 services）
```

**2. README 即入口**
- 项目 README 包含技术栈、启动命令、目录概览
- 每个模块有简短的职责说明
- 关键决策有文档追溯（ADR）

**3. 类型系统即契约**
- TypeScript strict mode
- 禁止 `any` 类型
- 接口定义替代隐式约定

---

## 支柱 2：Mechanical Enforcement（机械执行）

### 核心原则

约束由工具执行，不由指令执行。

### Agent 体验

```
指令方式（Probabilistic）：
"请使用 TypeScript strict mode" → Agent 偶尔忘记

机械执行方式（Deterministic）：
"使用 tsc --strict 编译" → 违反则构建失败
```

### 执行堆栈

```
第 1 层：Instructions（指令）
  ↓ 引导 Agent 做什么
第 2 层：Mechanical Enforcement（机械执行）
  ↓ 确保 Agent 无法绕过
第 3 层：Harness Infrastructure（基础设施）
  ↓ 环境级保障
```

### 常见约束及其实现

| 约束 | 指令（弱） | 机械执行（强） |
|------|-----------|---------------|
| 代码格式化 | "请使用 Prettier" | pre-commit hook 自动格式化 |
| Type Safety | "请使用 strict mode" | `tsc --strict` 构建检查 |
| 测试覆盖 | "请写测试" | CI 强制覆盖率 >80% |
| 禁止直接 DB 访问 | "Service 层不要直接操作 DB" | 架构检查工具 |
| Commit 规范 | "请用 conventional commits" | commit-msg hook 验证 |
| 无硬编码秘钥 | "不要提交 API Key" | secret scanning CI 步骤 |

### 错误消息是 Agent 的反馈

**问题**：Agent 在任务压力下（上下文窗口填满、注意力分散）会忽略指令。

**解决方案**：Linter 错误消息决定 Agent 是自我修正还是螺旋下降。

```
BAD：错误消息
"Error: something went wrong"

GOOD：错误消息
"Error: Type 'string' is not assignable to type 'number'.
  Expected number for parameter 'userId' at line 42.
  Hint: Use parseInt(userId) to convert."
```

---

## 支柱 3：Entropy Management（熵管理）

### 核心原则

随时间推移防止质量下降。代码库会漂移——文档过时、边界侵蚀、约定累积例外。

### Entropy 的常见表现

| 熵的类型 | 表现 | 后果 |
|----------|------|------|
| 文档腐化 | README 与实际代码不一致 | Agent 基于过时信息做决策 |
| 架构侵蚀 | 层级依赖被绕过 | 代码难以理解，修改风险增加 |
| 约定漂移 | "例外"累积，规则名存实亡 | Agent 学会绕过而非遵守 |
| 技术债务积累 | 未偿还债务压垮新功能 | 开发速度持续下降 |

### Entropy Management 的实践

**1. 渐进披露原则**

```
AGENTS.md (~100 行)      ← 入口索引
    └── docs/
        ├── architecture.md
        ├── conventions.md
        └── testing.md
```

- 任何超过 300 行的文档都应拆分
- 顶层索引保持简短，详细信息在子文档

**2. 为删除而构建**

每个约束编码一个"模型无法独自完成"的假设：

```
约束："禁止在 skills/ 直接开发"
假设：Agent 会直接在 skills/ 开发而不经过中转
失效条件：模型足够理解双重目录结构
```

当假设失效时，删除约束而非保留它。

**3. 技术债务追踪**

```markdown
# docs/tech-debt-tracker.md
| 债务 | 影响 | 优先级 | 状态 |
|------|------|--------|------|
| 旧 Auth 模块重构 | 安全风险 | P0 | 待处理 |
| 测试覆盖率不足 | 回归风险 | P1 | 进行中 |
```

**4. 定期回顾**

- 每次 sprint 回顾检查 AGENTS.md 和 docs/ 是否过时
- 重大架构变更后更新 Harness 文档
- 记录哪些约束已失效，可移除

---

## 三大支柱的协同效应

```
Legibility（做什么）
      ↓
Mechanical Enforcement（不能做什么）
      ↓
Entropy Management（持续保持）
      ↓
= 可靠的 Agent 开发环境
```

### OpenAI Codex 实验证明

三个支柱协同生效时：
- **Legibility** 告诉 Agent 该做什么
- **Mechanical Enforcement** 告诉 Agent 不能做什么
- **Entropy Management** 持续清理累积的混乱

---

## 对 cc-harness 的实践指导

| 支柱 | cc-harness 实现 |
|------|----------------|
| **Legibility** | `.claude/skills/<name>/SKILL.md` 定义职责；`references/` 目录包含模板 |
| **Mechanical Enforcement** | `evals/evals.json` 测试强制 SKILL.md 规范；pre-commit hook |
| **Entropy Management** | `harness-methodology/` 目录记录方法论；定期更新 AGENTS.md |

### cc-harness 应强制的约束

```yaml
# 强制约束清单
constraints:
  - id: no-direct-skills-edit
    description: "禁止在 skills/ 目录直接开发"
    enforcement: "CI 检查 .claude/skills/ 有对应更新"
    status: active

  - id: skill-must-have-frontmatter
    description: "SKILL.md 必须有 YAML frontmatter"
    enforcement: "evals/ schema 验证"
    status: active

  - id: no-internal-paths-in-docs
    description: "文档地图禁止引用 .claude/ 等内部路径"
    enforcement: "CI link 检查"
    status: active

  - id: skill-must-pass-evals
    description: "Skill 必须通过 evals/ 测试才能发布"
    enforcement: "evals/ 测试通过"
    status: active
```
