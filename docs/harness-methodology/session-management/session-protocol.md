# 会话协议：Orient → Act → Verify

> 来源：[OpenAI Codex](https://gist.github.com/celesteanders/21edad2367c8ede2ff092bd87e56a26f)、[AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/)

---

## 每次会话应遵循的流程

```
Orient（定位）→ Act（行动）→ Verify（验证）→ Summarize（总结）
```

---

## Orient（定位）

**目标**：理解当前状态和任务。

### 读取的文件

| 优先级 | 文件 | 用途 |
|--------|------|------|
| P0 | `AGENTS.md` | 项目整体规范 |
| P0 | `docs/progress.md` | 当前任务进度 |
| P1 | `docs/task-list.md` | 待办任务 |
| P1 | `package.json` / `go.mod` | 技术栈 |
| P2 | 最近 git commits | 最近的变更 |

### Orient 检查清单

```markdown
## 会话开始检查

### 1. 上下文状态
- [ ] AGENTS.md 已读取
- [ ] 当前任务已理解
- [ ] 上下文窗口使用率 < 50%

### 2. 任务理解
- [ ] 任务目标清晰
- [ ] 成功标准定义
- [ ] 约束条件已知

### 3. 环境准备
- [ ] 依赖已安装
- [ ] 开发服务器可运行（如适用）
- [ ] 最新代码已拉取
```

---

## Act（行动）

**目标**：执行任务，保持小而可审查的变更。

### Act 执行原则

| 原则 | 说明 |
|------|------|
| **小变更** | 每个变更应 < 10 个文件 |
| **孤立** | 不影响无关模块 |
| **可测试** | 每个变更后可验证 |

### 变更节奏

```
变更 1 → 测试 → 通过？ → 变更 2 → 测试 → 通过？ → ...
    ↓ 否                              ↓ 是
  修复                                  继续
```

### Act 检查清单

```markdown
## Act 执行检查

### 变更前
- [ ] 变更范围已定义
- [ ] 回滚计划已准备
- [ ] 相关文件已备份

### 变更中
- [ ] 变更保持小而专注
- [ ] 不引入无关变更
- [ ] 定期运行测试

### 变更后
- [ ] 相关测试通过
- [ ] 构建成功
- [ ] 无 lint 警告
```

---

## Verify（验证）

**目标**：确保变更符合要求，未破坏现有功能。

### Verify 检查清单

```markdown
## Verify 检查

### 功能验证
- [ ] 新功能工作正常
- [ ] 边界情况已测试
- [ ] 错误处理正确

### 回归验证
- [ ] 现有功能未被破坏
- [ ] 测试覆盖未降低
- [ ] 构建仍然成功

### 质量验证
- [ ] 代码符合规范
- [ ] 文档已更新（如需要）
- [ ] 无敏感信息泄漏
```

---

## Summarize（总结）

**目标**：记录进度和状态，供下次会话使用。

### Summarize 模板

```markdown
## 会话总结 [YYYY-MM-DD]

### 完成的工作
- [已完成任务 1]
- [已完成任务 2]

### 遇到的问题
- [问题 1]：[解决方案]
- [问题 2]：[未解决，需关注]

### 变更的文件
- [文件 1]：[变更描述]
- [文件 2]：[变更描述]

### 下一步
- [下一个待办任务]
- [需要关注的潜在问题]

### 状态
- [ ] 任务完成
- [ ] 任务进行中（阻塞于 X）
- [ ] 需要人工介入
```

---

## 状态文件

### 进度文件（progress.md）

```markdown
# 项目进度

## 当前阶段
[Phase 1: Harness 初始化]

## 已完成
- [x] 创建 AGENTS.md
- [x] 创建 docs/ 目录
- [ ] 创建 skill-creator

## 进行中
- [ ] 创建 docs-generator

## 待办
- [ ] 测试 harness-init
- [ ] 完善 evals/ 框架

## 阻塞
- 无

## 最后更新
2026-04-10
```

### 任务清单（task-list.json）

```json
{
  "tasks": [
    {
      "id": "t1",
      "title": "创建 docs-generator Skill",
      "status": "in_progress",
      "priority": "high",
      "depends_on": [],
      "created": "2026-04-09",
      "updated": "2026-04-10"
    },
    {
      "id": "t2",
      "title": "测试 harness-init",
      "status": "pending",
      "priority": "high",
      "depends_on": ["t1"],
      "created": "2026-04-09",
      "updated": "2026-04-09"
    }
  ],
  "version": "1.0"
}
```

---

## 会话持久化

### 何时保存状态

| 事件 | 保存内容 |
|------|----------|
| 任务完成里程碑 | 进度文件 + 总结 |
| 上下文使用率 > 70% | 上下文摘要 |
| 会话结束 | 完整状态 |
| 发现问题 | 问题记录 |

### 持久化内容

```markdown
# 状态持久化清单

### 必须保存
- [ ] 当前任务进度
- [ ] 变更的文件列表
- [ ] 测试结果

### 应该保存
- [ ] 上下文摘要
- [ ] 遇到的问题
- [ ] 下一步计划

### 可选保存
- [ ] 中间产物
- [ ] 调试信息
- [ ] 性能数据
```

---

## 常见问题

### 问题：上下文窗口快满了

```
症状：上下文使用率 > 80%

解决：
1. 保存当前进度到文件
2. 创建一个新的专注会话
3. 新会话读取进度文件
4. 继续执行
```

### 问题：任务变得模糊

```
症状：不确定是否继续当前任务

解决：
1. 停止执行
2. 重新 Orient
3. 确认任务目标
4. 继续或上报
```

### 问题：遇到无法解决的问题

```
症状：同一问题反复失败

解决：
1. 记录问题详情
2. 标记需要人工介入
3. 保存状态
4. 结束会话，等待人工处理
```

---

## 对 cc-harness 的实现

### 会话开始脚本

```bash
#!/bin/bash
# scripts/session-start.sh

echo "=== 会话开始：$(date) ==="

# Orient 阶段
echo "1. 读取项目规范..."
cat AGENTS.md | head -20

echo "2. 检查进度..."
if [ -f "docs/progress.md" ]; then
  cat docs/progress.md | head -30
else
  echo "进度文件不存在"
fi

echo "3. 检查 git 状态..."
git status --short

echo "=== 准备完成，开始执行 ==="
```

### 会话结束脚本

```bash
#!/bin/bash
# scripts/session-end.sh

echo "=== 会话结束：$(date) ==="

# 确认变更
echo "1. 变更摘要："
git diff --stat

# 确认测试
echo "2. 测试状态："
npm test -- --passWithNoTests 2>/dev/null && echo "✓ 测试通过" || echo "✗ 测试失败"

# 更新进度（如需要）
echo "3. 是否更新进度文件？(y/n)"
read update
if [ "$update" = "y" ]; then
  $EDITOR docs/progress.md
fi

echo "=== 会话结束 ==="
```
