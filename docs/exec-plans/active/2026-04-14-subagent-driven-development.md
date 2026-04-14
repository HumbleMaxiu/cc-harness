# Subagent-Driven Development 实现计划

> **面向代理工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 来逐任务实施此计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 实现 subagent-driven-development skill，支持 A/E/T/C 四种角色协同通过 Claude Code subagent 执行实现计划

**架构：** 通过 Claude Code Agent tool 派发 subagent，每个角色作为独立 subagent 运行在 `.claude/agents/` 目录。Controller 负责任务派发和流程协调，通过交接文档传递上下文。

**技术栈：** Claude Code Agent tool, Markdown, YAML 配置文件

---

## 文件结构概览

```
.claude/
  agents/
    architect.md          # 架构师 subagent
    engineer.md           # 工程师 subagent
    tester.md            # 测试工程师 subagent
    challenger.md        # 挑战者 subagent
    config/
      workflow.yaml      # 工作流配置（可编辑）

skills/
  subagent-driven-development/
    SKILL.md             # 使用指南
    handoffs/            # 交接文档模板
      architect-to-challenger.md
      challenger-to-engineer.md
      engineer-to-tester.md
      tester-to-challenger.md
      challenger-to-controller.md

docs/
  exec-plans/
    active/              # 进行中的计划
    completed/          # 已完成的计划
```

---

## Task 1: 创建目录结构

**文件：**
- 创建：`.claude/agents/`
- 创建：`.claude/agents/config/`
- 创建：`skills/subagent-driven-development/`
- 创建：`skills/subagent-driven-development/handoffs/`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p .claude/agents/config
mkdir -p skills/subagent-driven-development/handoffs
mkdir -p docs/exec-plans/active
mkdir -p docs/exec-plans/completed
```

- [ ] **Step 2: 验证目录创建**

```bash
ls -la .claude/agents/
ls -la .claude/agents/config/
ls -la skills/subagent-driven-development/
```

预期：所有目录已创建

- [ ] **Step 3: 提交**

```bash
git add .claude/agents skills/subagent-driven-development docs/exec-plans
git commit -m "feat: create subagent-driven-development directory structure"
```

---

## Task 2: 创建 workflow.yaml（工作流配置）

**文件：**
- 创建：`.claude/agents/config/workflow.yaml`

- [ ] **Step 1: 创建 workflow.yaml**

```yaml
# Subagent-Driven Development 工作流配置

## 角色定义

roles:
  architect:
    name: 架构师
    subagent: architect
    description: 负责规划、设计、文档维护和代码审查

  engineer:
    name: 工程师
    subagent: engineer
    description: 负责编码、bug 修复、重构和性能优化，TDD 实现

  tester:
    name: 测试工程师
    subagent: tester
    description: 负责测试编写、验证和 bug 报告

  challenger:
    name: 挑战者
    subagent: challenger
    description: 负责对抗性审查，质量门禁

## 流程阶段

phases:
  PLAN:
    description: Plan 阶段 - 架构师编写计划，挑战者审查
    agents: [architect, challenger]
    loop: ARCHITECT_CHALLENGER
    exit_condition: challenger_approves
    next: IMPLEMENT

  IMPLEMENT:
    description: 实现阶段 - 工程师实现，测试工程师测试，挑战者审查
    agents: [engineer, tester, challenger]
    loop: ENGINEER_TEST_CHALLENGER
    exit_condition: challenger_approves
    next: DONE

## 状态机

states:
  - name: ARCHITECT_CHALLENGER
    description: A-C 小循环
    transitions:
      - from: architect
        to: challenger
        handoff: architect-to-challenger
      - from: challenger
        to: architect  # 打回
        handoff: challenger-to-architect
      - from: challenger
        to: IMPLEMENT  # 通过
        handoff: challenger-to-engineer

  - name: ENGINEER_TEST_CHALLENGER
    description: E-T-C 小循环
    transitions:
      - from: engineer
        to: tester
        handoff: engineer-to-tester
      - from: tester
        to: engineer  # 打回
        handoff: tester-to-engineer
      - from: tester
        to: challenger
        handoff: tester-to-challenger
      - from: challenger
        to: engineer  # 打回
        handoff: challenger-to-engineer
      - from: challenger
        to: DONE  # 通过
        handoff: challenger-to-controller

## 交接文档模板位置

handoffs:
  architect-to-challenger: skills/subagent-driven-development/handoffs/architect-to-challenger.md
  challenger-to-engineer: skills/subagent-driven-development/handoffs/challenger-to-engineer.md
  engineer-to-tester: skills/subagent-driven-development/handoffs/engineer-to-tester.md
  tester-to-challenger: skills/subagent-driven-development/handoffs/tester-to-challenger.md
  challenger-to-controller: skills/subagent-driven-development/handoffs/challenger-to-controller.md

## Agent 状态

agent_statuses:
  - DONE          # 完成
  - DONE_WITH_CONCERNS  # 完成但有疑虑
  - BLOCKED       # 被阻塞，无法继续
  - NEEDS_CONTEXT # 需要更多信息
```

- [ ] **Step 2: 提交**

```bash
git add .claude/agents/config/workflow.yaml
git commit -m "feat: add workflow.yaml configuration"
```

---

## Task 3: 创建 architect.md（架构师 subagent）

**文件：**
- 创建：`.claude/agents/architect.md`

- [ ] **Step 1: 创建 architect.md**

文件内容：

```markdown
---
name: architect
description: 架构师 - 负责规划、设计、文档维护和代码审查。用于设计系统架构、编写计划文档、记录 ADR。
tools: Read, Write, Bash, Glob, Grep, Grep, WebSearch
---

# 架构师 (Architect)

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

全部：读写文件、执行命令、搜索、网络搜索

## 协作协议

- 向工程师分配任务时附上上下文链接
- 审查工程师的输出
- 完成后通知挑战者进行审查

## 输出格式

完成后返回以下状态之一：
- **DONE**：完成
- **DONE_WITH_CONCERNS**：完成但有疑虑
- **BLOCKED**：被阻塞，无法继续
- **NEEDS_CONTEXT**：需要更多信息

## 交接文档

请生成 `handoffs/architect-to-challenger.md`
```

- [ ] **Step 2: 提交**

```bash
git add .claude/agents/architect.md
git commit -m "feat: add architect subagent"
```

---

## Task 4: 创建 engineer.md（工程师 subagent）

**文件：**
- 创建：`.claude/agents/engineer.md`

- [ ] **Step 1: 创建 engineer.md**

文件内容：

```markdown
---
name: engineer
description: 工程师 - 负责编码、bug 修复、重构和性能优化。采用 TDD 方式先写测试再实现功能。
tools: Read, Write, Bash, Glob, Grep
---

# 工程师 (Engineer)

你是一名工程师，负责编码、bug 修复、重构和性能优化。

## 职责

- 编码实现功能
- Bug 修复
- 重构优化
- 性能优化

## 行为约束

- 遵循 docs/conventions/ 中的所有约定
- 每个功能/修复必须包含测试
- 禁止修改架构级代码，除非架构师批准
- 提交前自检：lint、测试、安全标准
- **TDD 要求**：先写失败的测试，再实现功能

## TDD 流程

1. 写失败的测试
2. 运行测试验证失败
3. 实现功能
4. 运行测试验证通过
5. 自审
6. 提交

## 输出格式

完成后返回以下状态之一：
- **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** / **NEEDS_CONTEXT**

## 交接文档

请生成 `handoffs/engineer-to-tester.md`
```

- [ ] **Step 2: 提交**

```bash
git add .claude/agents/engineer.md
git commit -m "feat: add engineer subagent"
```

---

## Task 5: 创建 tester.md（测试工程师 subagent）

**文件：**
- 创建：`.claude/agents/tester.md`

- [ ] **Step 1: 创建 tester.md**

文件内容：

```markdown
---
name: tester
description: 测试工程师 - 负责测试编写、验证和 bug 报告。聚焦边界情况、错误处理和安全场景。
tools: Read, Bash, Glob, Grep
---

# 测试工程师 (Tester)

你是一名测试工程师，负责测试编写、验证和 bug 报告。

## 行为约束

- **禁止修改业务代码**——只写测试代码和 bug 报告
- 发现 bug 时记录：复现步骤、预期行为、实际行为
- 验证工程师的修复是否完整
- 聚焦于边界情况、错误处理、安全场景

## 测试重点

- 边界情况测试
- 错误处理测试
- 安全场景测试

## 输出格式

完成后返回以下状态之一：
- **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** / **NEEDS_CONTEXT**

## 交接文档

请生成 `handoffs/tester-to-challenger.md`
```

- [ ] **Step 2: 提交**

```bash
git add .claude/agents/tester.md
git commit -m "feat: add tester subagent"
```

---

## Task 6: 创建 challenger.md（挑战者 subagent）

**文件：**
- 创建：`.claude/agents/challenger.md`

- [ ] **Step 1: 创建 challenger.md**

文件内容：

```markdown
---
name: challenger
description: 挑战者 - 负责对计划、设计和声明进行对抗性审查。在缺陷变成 bug 前找出它们。
tools: Read, Bash, Glob, Grep, WebSearch
---

# 挑战者 (Challenger)

你是一名挑战者，负责对计划、设计和声明进行对抗性审查。

## 行为约束

- 绝不接受没有证据的声明
- 绝不走形式
- 用具体问题质疑，而非模糊的怀疑
- **禁止修改代码**

## 输出格式

每个关注点：
- **主张（CLAIM）**：陈述了什么
- **挑战（CHALLENGE）**：为什么可能是错的
- **验证（VERIFICATION）**：如何确认
- **裁决（VERDICT）**：确认 / 反驳 / 未验证

## 升级规则

- 2+ 条主张被反驳 → 阻止，发回
- 全部未验证 → 推荐验证步骤
- 全部确认 → 批准

## 输出状态

完成后返回以下状态之一：
- **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** / **NEEDS_CONTEXT**

## 交接文档

请生成 `handoffs/challenger-to-controller.md`
如通过 Plan 阶段，还需生成 `handoffs/challenger-to-engineer.md`
```

- [ ] **Step 2: 提交**

```bash
git add .claude/agents/challenger.md
git commit -m "feat: add challenger subagent"
```

---

## Task 7: 创建所有 handoff 模板

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
git commit -m "feat: add handoff templates"
```

---

## Task 8: 创建 SKILL.md（使用指南）

**文件：**
- 创建：`skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: 创建 SKILL.md**

```markdown
---
name: subagent-driven-development
description: 通过 Claude Code subagent 执行实现计划，支持 A/E/T/C 四种角色协同工作
---

# Subagent-Driven Development

通过 Claude Code subagent 执行实现计划...

## 角色

| 角色 | Subagent | 职责 |
|------|----------|------|
| 架构师 (A) | @architect | 规划、设计、文档维护 |
| 工程师 (E) | @engineer | TDD 实现 |
| 测试工程师 (T) | @tester | 独立测试 |
| 挑战者 (C) | @challenger | 对抗性审查 |

## 流程

### Plan 阶段
A → C → [A-C 循环] → C 通过 → 进入实现

### 实现阶段
E → T → [E-T 循环] → C → [E/T-C 循环] → 下一任务

## Subagent 调用

使用 @<subagent-name> 调用：
@architect 审查计划
@engineer 实现任务
@tester 补充测试
@challenger 审查

详见完整文档...
```

- [ ] **Step 2: 提交**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: add SKILL.md usage guide"
```

---

## Task 9: 整体验证

- [ ] **Step 1: 验证所有文件已创建**

```bash
find .claude/agents -type f | sort
find skills/subagent-driven-development -type f | sort
```

预期输出应包含：
- `.claude/agents/architect.md`
- `.claude/agents/engineer.md`
- `.claude/agents/tester.md`
- `.claude/agents/challenger.md`
- `.claude/agents/config/workflow.yaml`
- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/handoffs/*.md` (5 个文件)

- [ ] **Step 2: 查看 git 状态**

```bash
git status
git log --oneline -5
```
