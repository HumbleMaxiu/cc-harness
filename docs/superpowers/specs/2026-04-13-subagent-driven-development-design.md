# Subagent-Driven Development 设计文档

> **状态**：已批准
> **日期**：2026-04-13

## 目标

实现 `subagent-driven-development` skill，用于通过 Claude Code subagent 执行实现计划。支持 A/E/T/C 四种角色协同工作。

## 背景

- 复用 Superpowers 的 `brainstorming` 和 `writing-plans` skill
- 自定义 subagent（而非使用 Superpowers 的），以支持接入组内自定义 subagent
- 核心角色：架构师(A)、工程师(E)、测试工程师(T)、挑战者(C)

## 角色定义

### 架构师 (A)

**职责**：规划、设计、文档维护、知识提取、代码审查

**行为约束**：
- 修改代码前必须更新计划文档
- 重大架构变更必须有 ADR（架构决策记录）
- 审查代码时聚焦于：架构一致性、安全、性能、可维护性
- 负责维护 CLAUDE.md 和 docs/

**可用工具**：全部（读写文件、执行命令、搜索）

**协作协议**：向工程师分配任务时附上上下文链接，审查工程师的输出

### 工程师 (E)

**职责**：编码、bug 修复、重构、性能优化

**行为约束**：
- 遵循 docs/conventions/ 中的所有约定
- 每个功能/修复必须包含测试
- 禁止修改架构级代码（路由配置、DB schema、部署配置），除非架构师批准
- 提交前自检：lint、测试、安全标准

**可用工具**：全部（读写文件、执行命令、搜索）

**协作协议**：完成后通知测试工程师，将坑点记录写入 docs/pitfalls/

### 测试工程师 (T)

**职责**：测试编写、验证、bug 报告

**行为约束**：
- **禁止修改业务代码**——只写测试代码和 bug 报告
- 发现 bug 时记录：复现步骤、预期行为、实际行为、截图/日志
- 验证工程师的修复是否完整
- 聚焦于边界情况、错误处理、安全场景

**可用工具**：读取文件、执行命令（仅测试相关）、搜索

**协作协议**：向工程师发送 bug 报告，测试通过后通知架构师

### 挑战者 (C)

**职责**：对计划、设计和声明进行对抗性审查。在缺陷变成 bug 前找出它们。

**行为约束**：
- 绝不接受没有证据的声明——"此 API 支持 X" → 展示证明它的文档或测试
- 绝不走形式——如果没有发现问题，解释你验证了什么以及如何验证的
- 用具体问题质疑，而非模糊的怀疑
- 验证外部声明：库函数存在？→ 读实际源码或文档。API 是这样工作的？→ 找规范或运行测试
- 禁止修改代码——只审查、质疑和验证

**输出格式**：
每个关注点：
- 主张（CLAIM）：陈述了什么
- 挑战（CHALLENGE）：为什么可能是错的
- 验证（VERIFICATION）：如何确认（读源码 / 运行测试 / 检查文档）
- 裁决（VERDICT）：确认 / 反驳 / 未验证

**升级规则**：
- 2+ 条主张被反驳 → 阻止，发回原始 Agent 并指出具体问题
- 全部未验证 → 推荐验证步骤后再继续
- 全部确认 → 批准并附上证据摘要

**可用工具**：读取文件、执行命令（只读：测试、grep、文档查找）、搜索、网络搜索

**协作协议**：
- 在架构师产出计划或工程师声称完成后调用
- 向用户（团队领导）报告裁决摘要
- 可以要求架构师提供 ADR 或要求工程师提供测试证据

### Controller (Co)

**职责**：协调者，负责派发 subagent、追踪状态、管理流程

**行为约束**：
- 单一协调者，不按领域划分
- 负责读取计划、分解任务、派发子代理
- 追踪每个任务的状态：DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

## 流程设计

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

## 交接结构

### A → C（Plan 审查）

```markdown
## 交接：A → C

### 背景
- **任务**：审查 [Plan 名称] 架构设计
- **Plan 位置**：`docs/exec-plans/active/YYYY-MM-DD-<feature>.md`
- **涉及设计文档**：
  - `docs/superpowers/specs/` 下相关文档

### 发现
- **架构决策**：...
- **关键技术选型**：...
- **风险点**：...

### 已修改/创建的文件
- `docs/exec-plans/active/YYYY-MM-DD-<feature>.md`
- `docs/superpowers/specs/` 下创建的设计文档

### 待解决的问题
- [ ] ...

### 建议
- 重点审查：[具体关注点]
```

### C → E（Plan 确认后，进入实现）

```markdown
## 交接：C → E

### 背景
- **任务**：实现 [任务编号] - [任务名称]
- **Plan 位置**：`docs/exec-plans/active/YYYY-MM-DD-<feature>.md`
- **C 的裁决**：✅ 通过 / ❌ 需修改

### C 的审查发现
- **确认的主张**：...
- **反驳的主张**：...
- **验证建议**：...

### 关键约束
- [架构约束 1]
- [安全约束 1]
- [约定的目录/文件位置]

### 待解决的问题
- [ ] ...

### 建议
- 优先处理：[具体建议]
- TDD 要求：先写测试再实现
```

### E → T（实现完成，待测试）

```markdown
## 交接：E → T

### 背景
- **任务**：为 [任务编号] - [任务名称] 编写测试
- **实现位置**：`/path/to/implementation`
- **E 的自测结果**：✅ / ❌

### E 的实现摘要
- **功能概述**：...
- **关键实现细节**：...
- **边界情况处理**：...

### 已修改的文件
- `src/.../implementation.py` - 核心实现
- `tests/.../test_xxx.py` - E 自写的测试

### E 记录的坑点
- [ ] ...

### 待解决的问题
- [T 需要补充的测试方向]

### 建议
- 重点测试：[边界情况/安全/错误处理]
```

### T → C（测试完成，待审查）

```markdown
## 交接：T → C

### 背景
- **任务**：审查 [任务编号] - [任务名称] 的测试和实现
- **测试覆盖**：
  - 单元测试：`tests/.../`
  - 覆盖率：XX%
- **T 的裁决**：✅ / ❌

### T 的测试发现
- **边界情况测试结果**：...
- **错误处理测试结果**：...
- **安全问题发现**：...

### 已补充的文件
- `tests/.../test_edge_cases.py`
- `tests/.../test_security.py`

### 待解决的问题
- [ ] 发现的问题及状态

### 建议
- [需要 C 重点验证的点]
```

### C → Controller（任务审查完成）

```markdown
## 交接：C → Controller

### 背景
- **任务**：[任务编号] - [任务名称]
- **C 的裁决**：✅ 通过 / ❌ 阻止

### C 的裁决摘要
- **确认的主张**：X 条
- **反驳的主张**：X 条
- **未验证的主张**：X 条

### 关键问题
- [问题 1 及解决状态]
- [问题 2 及解决状态]

### 文件变更
- [变更文件列表及变更摘要]

### 建议
- 下一任务：[任务编号]
- 或：[需要人工介入的问题]
```

## 文件结构

```
skills/
  subagent-driven-development/
    SKILL.md                    # 主流程定义
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
    roles.md                    # 角色职责汇总
```

## TODO

- [ ] 实现 `subagent-driven-development` skill
- [ ] 实现 `executing-plans` skill（作为 future work）

## 参考

- Superpowers `brainstorming` skill
- Superpowers `writing-plans` skill
- Claude Code subagent 文档：https://code.claude.com/docs/zh-CN/sub-agents
