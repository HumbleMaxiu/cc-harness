# AGENTS.md 生成模板

使用此模板生成项目的 AGENTS.md，目标 ≤ 120 行。

---

```markdown
# {{项目名称}}

{{一句话项目描述}}

## 文档导航

| 类别 | 路径 | 内容 |
|------|------|------|
| 设计理念 | [docs/DESIGN.md](docs/DESIGN.md) | 系统设计原则和目标 |
| 路线图 | [docs/PLANS.md](docs/PLANS.md) | 执行阶段和产品路线图 |
| 产品感觉 | [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | 产品为谁服务、什么是"好" |
| 质量评分 | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | 质量维度的记分卡 |
| 可靠性 | [docs/RELIABILITY.md](docs/RELIABILITY.md) | 超时、重试、幂等性、observability |
| 安全 | [docs/SECURITY.md](docs/SECURITY.md) | Secrets、auth、audit 预期 |
| Memory | [docs/memory/index.md](docs/memory/index.md) | 项目记忆与反馈索引 |
| 前端 | [docs/FRONTEND.md](docs/FRONTEND.md) | UI 约定、a11y、routing/state（可选） |
| 设计文档 | [docs/design-docs/](docs/design-docs/index.md) | 核心设计决策和信念 |
| 执行计划 | [docs/exec-plans/](docs/exec-plans/index.md) | 主动执行中的计划 |
| 产品规格 | [docs/product-specs/](docs/product-specs/index.md) | 各领域产品规格文档 |
| 生成产物 | [docs/generated/](docs/generated/index.md) | DB/API schema 占位符 |
| 参考文献 | [docs/references/](docs/references/index.md) | LLM context stubs |

## 命令快速参考

```bash
# 开发环境
{{install_command}}
{{run_command}}

# 测试
{{test_command}}

# 构建与部署
{{build_command}}
{{deploy_command}}
```

## Skill 快速参考

| Skill | 用途 |
|-------|------|
| {{skill_name}} | {{skill_description}} |

## Harness 命令

| 命令 | 描述 |
|------|------|
| harness help | 命令索引 + 场景快速参考 |
| harness audit | 项目健康检查 |
| harness quality gate | 提交前质量门禁 |
| harness guide | Skill 推荐 |

## 上下文恢复（/compact 后或新会话）

按此顺序重新读取 — 不要全部重新读取，先读索引再按需读取：
1. 本文件 (AGENTS.md) — 已自动加载
2. [docs/PLANS.md](docs/PLANS.md) — 当前计划进度
3. [docs/design-docs/INDEX.md](docs/design-docs/INDEX.md) — 设计文档索引
4. 具体模块对应的 docs/ 文件

## Token 预算

- 在 Phase 边界使用 /compact；compact 后重新读取 docs/PLANS.md
- 大文件 (>300 行)：使用 offset+limit 分段读取
- 结构化输出（JSON/表格）优先于长篇论述
- 先读索引 (INDEX.md)，再按需读取叶子文档

## 行为规则

### 必须 (MUST)
- MUST 在编码前先头脑风暴 (HARD-GATE)
- MUST 写测试再实现 (TDD)
- MUST 提交前安全审查
- MUST NOT eval()/exec() 处理用户输入 — CWE-95
- MUST NOT shell=True 传用户参数 — CWE-78
- MUST NOT f-string/format SQL 拼接 — CWE-89
- MUST NOT 提交 .env / *.key / *.pem — CWE-798
- MUST NOT 留死代码 / 调试输出
- MUST NOT 未经验证就声称完成
- 声称"完成"前 → 运行标准质量门禁（文档同步 + 代码规范 + 进度验证）

### 反馈规则
- 用户反馈 → 记录到 `docs/memory/feedback/user-feedback.md` 并立即应用
- Agent 反馈 → 记录到 `docs/memory/feedback/agent-feedback.md`，阻塞项优先自动修复回流，非阻塞建议在最终交付统一汇总
- 同类问题出现 2 次或以上 → 同步到 `docs/memory/feedback/prevents-recurrence.md` 并升级为规范

### 文档同步（编辑源码后自检）
- 编辑源码后检查：对应的 docs/ 模块文档是否存在？
  - 如果存在且变更影响其内容（API、schema、配置）→ 立即更新
  - 如果不确定 → 在 progress.md 中注明，稍后质量门禁验证

### /compact 前（强制检查点）
- 更新 progress.md 当前状态和未提交的决定
- 更新 docs/PLANS.md Phase 复选框以反映实际进度
- 记录所有需要恢复的进行中工作

### 效率规则
- 在 Phase 边界使用 /compact，而非任务中途
- compact 后重新读取 docs/PLANS.md
- 大文件 (>300 行)：使用 offset+limit

## Agent 团队

| 角色 | 定义 |
|------|------|
| {{role}} | [.harness/agents/{{role}}.md](.harness/agents/{{role}}.md) |

## How to use this harness

| 场景 | 从这里开始 | 然后 |
| ---- | ---------- | ---- |
| 新功能 | `docs/product-specs/<domain>.md` | 在 `docs/exec-plans/active/` 创建计划 → 实现 → 移动到 `completed/` |
| Bug 修复 | `docs/RELIABILITY.md` + `docs/SECURITY.md` | 修复 → 更新 `docs/QUALITY_SCORE.md` |
| 架构变更 | `ARCHITECTURE.md` | 添加 `docs/design-docs/<name>.md` → 从 index 链接 → 实现 |

Tech debt、文档维护和其他工作流请参阅 [docs/PLANS.md](docs/PLANS.md)。
```

---

## 使用说明

生成 AGENTS.md 时：
1. 将 `{{}}` 中的占位符替换为项目实际信息
2. 保持文档导航表格简洁，路径确保正确
3. 命令快速参考根据项目实际脚本填充
4. 行为规则部分必须保留，可根据项目需求补充
5. 确保最终文件 ≤ 120 行
