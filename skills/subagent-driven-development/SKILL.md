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
