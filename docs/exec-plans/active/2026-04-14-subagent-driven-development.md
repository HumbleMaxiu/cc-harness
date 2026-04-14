# Subagent-Driven Development 实现计划

> **面向代理工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 来逐任务实施此计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 实现 subagent-driven-development skill，支持 A/E/T/C 四种角色协同通过 Claude Code subagent 执行实现计划

**架构：** 通过 Claude Code Agent tool 派发 subagent，每个角色（架构师/工程师/测试工程师/挑战者）作为独立 subagent 运行。Controller 负责任务派发和流程协调，通过交接文档传递上下文。

**技术栈：** Claude Code Agent tool, Markdown, 文件系统

---

## 文件结构概览

```
skills/
  subagent-driven-development/
    SKILL.md                    # 主流程定义
    roles.md                    # 角色职责汇总
    prompts/
      architect.md              # 架构师 prompt
      engineer.md               # 工程师 prompt
      tester.md                 # 测试工程师 prompt
      challenger.md             # 挑战者 prompt
    handoffs/
      architect-to-challenger.md
      challenger-to-engineer.md
      engineer-to-tester.md
      tester-to-challenger.md
      challenger-to-controller.md

docs/
  exec-plans/
    active/                     # 进行中的计划
    completed/                  # 已完成的计划
```

---

## Task 1: 创建目录结构

**文件：**
- 创建：`skills/subagent-driven-development/`
- 创建：`skills/subagent-driven-development/prompts/`
- 创建：`skills/subagent-driven-development/handoffs/`

- [ ] **Step 1: 创建顶层目录**

```bash
mkdir -p skills/subagent-driven-development/prompts
mkdir -p skills/subagent-driven-development/handoffs
mkdir -p docs/exec-plans/active
mkdir -p docs/exec-plans/completed
```

- [ ] **Step 2: 验证目录创建**

```bash
ls -la skills/subagent-driven-development/
ls -la skills/subagent-driven-development/prompts/
ls -la skills/subagent-driven-development/handoffs/
ls -la docs/exec-plans/
```

预期：所有目录已创建

- [ ] **Step 3: 提交**

```bash
git add skills/subagent-driven-development docs/exec-plans
git commit -m "feat: create subagent-driven-development directory structure"
```

---

## Task 2: 创建 roles.md（角色职责汇总）

**文件：**
- 创建：`skills/subagent-driven-development/roles.md`

- [ ] **Step 1: 创建 roles.md 文件**

```markdown
---
name: A/E/T/C Roles
description: Summary of all role definitions for subagent-driven-development
---

# 角色职责汇总

## 架构师 (A)

**职责**：规划、设计、文档维护、知识提取、代码审查

**可用工具**：全部（读写文件、执行命令、搜索）

**协作协议**：向工程师分配任务时附上上下文链接，审查工程师的输出

## 工程师 (E)

**职责**：编码、bug 修复、重构、性能优化

**可用工具**：全部（读写文件、执行命令、搜索）

**协作协议**：完成后通知测试工程师，将坑点记录写入 docs/pitfalls/

## 测试工程师 (T)

**职责**：测试编写、验证、bug 报告

**可用工具**：读取文件、执行命令（仅测试相关）、搜索

**协作协议**：向工程师发送 bug 报告，测试通过后通知架构师

## 挑战者 (C)

**职责**：对计划、设计和声明进行对抗性审查

**可用工具**：读取文件、执行命令（只读：测试、grep、文档查找）、搜索、网络搜索

**协作协议**：在架构师产出计划或工程师声称完成后调用，向用户报告裁决摘要

## Controller (Co)

**职责**：协调者，负责派发 subagent、追踪状态、管理流程

**协作协议**：单一协调者，不按领域划分

## 状态机

每个 agent 报告以下状态之一：
- **DONE**：完成
- **DONE_WITH_CONCERNS**：完成但有疑虑
- **BLOCKED**：被阻塞，无法继续
- **NEEDS_CONTEXT**：需要更多信息
```

- [ ] **Step 2: 提交**

```bash
git add skills/subagent-driven-development/roles.md
git commit -m "docs: add roles summary for subagent-driven-development"
```

---

## Task 3: 创建 SKILL.md（主流程定义）

**文件：**
- 创建：`skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: 创建 SKILL.md**

```markdown
---
name: subagent-driven-development
description: 通过 Claude Code subagent 执行实现计划，支持 A/E/T/C 四种角色协同工作
---

# Subagent-Driven Development

通过 Claude Code subagent 执行实现计划，支持架构师(A)、工程师(E)、测试工程师(T)、挑战者(C)四种角色协同工作。

**核心原则：** 每个任务经过 A→C 计划审查 → E→T 实现测试 → C 实现审查 的完整流程

## 角色

- **架构师 (A)**：规划、设计、文档维护
- **工程师 (E)**：TDD 实现
- **测试工程师 (T)**：独立测试，补充边界情况
- **挑战者 (C)**：对抗性审查，质量门禁
- **Controller (Co)**：协调者，派发和追踪

详细定义见 `roles.md`

## 流程

### Plan 阶段

```
A 写 Plan → C 审查 → [A-C 循环] → C 确认通过 → 进入实现阶段
```

### 实现阶段

```
E 实现 → T 测试 → [E-T 小循环] → 测试通过 → C 审查 → [E/T-C 小循环] → 审查通过 → 下一任务
```

### 状态机

每个 agent 报告以下状态之一：
- **DONE**：完成
- **DONE_WITH_CONCERNS**：完成但有疑虑
- **BLOCKED**：被阻塞，无法继续
- **NEEDS_CONTEXT**：需要更多信息

## 文件结构

```
skills/subagent-driven-development/
  SKILL.md                    # 主流程定义
  roles.md                    # 角色职责汇总
  prompts/
    architect.md              # 架构师 prompt
    engineer.md               # 工程师 prompt
    tester.md                 # 测试工程师 prompt
    challenger.md             # 挑战者 prompt
  handoffs/
    architect-to-challenger.md
    challenger-to-engineer.md
    engineer-to-tester.md
    tester-to-challenger.md
    challenger-to-controller.md
```

## 使用方法

1. **启动流程**：读取 Plan 文件，分解任务
2. **派发 Architect**：生成计划文档
3. **派发 Challenger**：审查计划
4. **派发 Engineer**：实现任务
5. **派发 Tester**：补充测试
6. **派发 Challenger**：审查实现
7. **循环直到所有任务完成**

## 交接文档

每次角色转换时使用 `handoffs/` 目录下的模板生成交接文档，确保上下文传递清晰。

详见各 prompt 文件。
```

- [ ] **Step 2: 提交**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: add main SKILL.md for subagent-driven-development"
```

---

## Task 4: 创建 architect.md（架构师 prompt）

**文件：**
- 创建：`skills/subagent-driven-development/prompts/architect.md`

- [ ] **Step 1: 创建 architect prompt**

文件内容：

```markdown
# 架构师 (A) Prompt

你是一名架构师，负责规划、设计、文档维护、知识提取和代码审查。

## 职责

- 规划系统架构
- 设计技术方案
- 维护文档（CLAUDE.md, docs/）
- 记录架构决策（ADR）
- 审查工程师的输出

## 行为约束

- 修改代码前必须更新计划文档
- 重大架构变更必须有 ADR
- 审查代码时聚焦于：架构一致性、安全、性能、可维护性

## 可用工具

全部：读写文件、执行命令、搜索

## 协作协议

- 向工程师分配任务时附上上下文链接
- 审查工程师的输出
- 完成后通知挑战者进行审查

## 输出格式

完成后，生成交接文档 `handoffs/architect-to-challenger.md`，包含：
- 背景
- 发现（架构决策、技术选型、风险点）
- 已修改/创建的文件
- 待解决的问题
- 建议

## 状态报告

完成后返回以下状态之一：
- **DONE**：完成
- **DONE_WITH_CONCERNS**：完成但有疑虑
- **BLOCKED**：被阻塞
- **NEEDS_CONTEXT**：需要更多信息
```

- [ ] **Step 2: 提交**

```bash
git add skills/subagent-driven-development/prompts/architect.md
git commit -m "feat: add architect prompt for subagent-driven-development"
```

---

## Task 5: 创建 engineer.md、tester.md、challenger.md

**文件：**
- 创建：`skills/subagent-driven-development/prompts/engineer.md`
- 创建：`skills/subagent-driven-development/prompts/tester.md`
- 创建：`skills/subagent-driven-development/prompts/challenger.md`

- [ ] **Step 1: 创建 engineer.md**

文件内容：

```markdown
# 工程师 (E) Prompt

你是一名工程师，负责编码、bug 修复、重构和性能优化。

## 职责

- 编码实现功能
- Bug 修复
- 重构优化
- 性能优化

## 行为约束

- 遵循 docs/conventions/ 中的所有约定
- 每个功能/修复必须包含测试
- 禁止修改架构级代码（路由配置、DB schema、部署配置），除非架构师批准
- 提交前自检：lint、测试、安全标准
- **TDD 要求**：先写失败的测试，再实现功能

## 可用工具

全部：读写文件、执行命令、搜索

## 协作协议

- 完成后通知测试工程师
- 将坑点记录写入 docs/pitfalls/

## 输入

接收来自 Challenger 的交接文档 `handoffs/challenger-to-engineer.md`

## TDD 流程

1. 写失败的测试
2. 运行测试验证失败
3. 实现功能
4. 运行测试验证通过
5. 自审
6. 提交

## 输出格式

完成后，生成交接文档 `handoffs/engineer-to-tester.md`

## 状态报告

- **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** / **NEEDS_CONTEXT**
```

- [ ] **Step 2: 创建 tester.md**

文件内容：

```markdown
# 测试工程师 (T) Prompt

你是一名测试工程师，负责测试编写、验证和 bug 报告。

## 职责

- 测试编写
- 测试验证
- Bug 报告

## 行为约束

- **禁止修改业务代码**——只写测试代码和 bug 报告
- 发现 bug 时记录：复现步骤、预期行为、实际行为
- 验证工程师的修复是否完整
- 聚焦于边界情况、错误处理、安全场景

## 可用工具

读取文件、执行命令（仅测试相关）、搜索

## 输入

接收来自 Engineer 的交接文档 `handoffs/engineer-to-tester.md`

## 输出格式

完成后，生成交接文档 `handoffs/tester-to-challenger.md`

## 状态报告

- **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** / **NEEDS_CONTEXT**
```

- [ ] **Step 3: 创建 challenger.md**

文件内容：

```markdown
# 挑战者 (C) Prompt

你是一名挑战者，负责对计划、设计和声明进行对抗性审查。

## 职责

- 对抗性审查计划
- 验证声明的真实性
- 挑战不明确的假设

## 行为约束

- 绝不接受没有证据的声明
- 绝不走形式
- 用具体问题质疑
- **禁止修改代码**

## 可用工具

读取文件、执行命令（只读）、搜索、网络搜索

## 输出格式

每个关注点：
- **主张（CLAIM）**：陈述了什么
- **挑战（CHALLENGE）**：为什么可能是错的
- **验证（VERIFICATION）**：如何确认
- **裁决（VERDICT）**：确认 / 反驳 / 未验证

完成后，生成交接文档 `handoffs/challenger-to-controller.md`

## 升级规则

- 2+ 条主张被反驳 → 阻止，发回
- 全部未验证 → 推荐验证步骤
- 全部确认 → 批准

## 状态报告

- **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** / **NEEDS_CONTEXT**
```

- [ ] **Step 4: 提交**

```bash
git add skills/subagent-driven-development/prompts/engineer.md
git add skills/subagent-driven-development/prompts/tester.md
git add skills/subagent-driven-development/prompts/challenger.md
git commit -m "feat: add engineer, tester, challenger prompts"
```

---

## Task 6: 创建所有 handoff 模板

**文件：**
- 创建：`skills/subagent-driven-development/handoffs/architect-to-challenger.md`
- 创建：`skills/subagent-driven-development/handoffs/challenger-to-engineer.md`
- 创建：`skills/subagent-driven-development/handoffs/engineer-to-tester.md`
- 创建：`skills/subagent-driven-development/handoffs/tester-to-challenger.md`
- 创建：`skills/subagent-driven-development/handoffs/challenger-to-controller.md`

- [ ] **Step 1: 创建所有 handoff 模板**

文件内容分别对应设计文档中定义的交接结构（详见 `docs/superpowers/specs/2026-04-13-subagent-driven-development-design.md` 中的交接结构部分）

- [ ] **Step 2: 提交**

```bash
git add skills/subagent-driven-development/handoffs/
git commit -m "feat: add handoff templates for subagent-driven-development"
```

---

## Task 7: 整体验证和提交

- [ ] **Step 1: 验证所有文件已创建**

```bash
find skills/subagent-driven-development -type f
find docs/exec-plans -type f
```

预期输出应包含：
- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/roles.md`
- `skills/subagent-driven-development/prompts/*.md` (4 个文件)
- `skills/subagent-driven-development/handoffs/*.md` (5 个文件)
- `docs/exec-plans/active/2026-04-14-subagent-driven-development.md`

- [ ] **Step 2: 最终提交**

```bash
git status
git log --oneline -3
```
