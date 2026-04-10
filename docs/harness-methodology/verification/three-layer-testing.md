# AI Agent 三层测试

> 来源：[AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/)、[Stripe Minions](https://guild.xyz/slug/stripe)、[Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)

---

## 概述

AI Agent 的测试与普通软件测试不同。传统测试验证代码是否正确执行，Agent 测试验证 **Agent + Harness** 系统是否按预期工作。

---

## 三层测试模型

```
┌─────────────────────────────────────────────────────────────┐
│  L3: Statistical Validation（统计验证）                      │
│  每周运行 │ 通过率方差测量 │ 系统健康监控                    │
├─────────────────────────────────────────────────────────────┤
│  L2: Model Evaluation（模型评估）                           │
│  每次 PR │ AI 作为裁判 │ 输出质量评估                       │
├─────────────────────────────────────────────────────────────┤
│  L1: Deterministic Checks（确定性检查）                      │
│  每次 Commit │ 结构属性 │ 类型检查 │ Lint                   │
└─────────────────────────────────────────────────────────────┘

成本：低 ──────────────────────────────────────────→ 高
速度：快 ──────────────────────────────────────────→ 慢
```

---

## L1：确定性检查

**运行频率**：每次 commit

**特点**：
- 完全确定性
- 毫秒级执行
- 零成本

### L1 检查项

| 检查 | 工具 | 失败时 |
|------|------|--------|
| SKILL.md Schema 验证 | jsonschema | 构建失败 |
| 必需字段存在 | 脚本 | 构建失败 |
| 目录结构正确 | 脚本 | 构建失败 |
| Markdown 格式 | markdownlint | 警告 |
| 无内部路径泄漏 | grep | 构建失败 |
| 文件可读 | 脚本 | 警告 |

### L1 示例

```bash
#!/bin/bash
# validate-skill.sh

SKILL_DIR=$1

# 检查 SKILL.md 存在
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
  echo "ERROR: SKILL.md not found"
  exit 1
fi

# 检查 frontmatter
if ! head -5 "$SKILL_DIR/SKILL.md" | grep -q "^---"; then
  echo "ERROR: Missing YAML frontmatter"
  exit 1
fi

# 检查必需字段
if ! grep -q "^name:" "$SKILL_DIR/SKILL.md"; then
  echo "ERROR: Missing 'name' field"
  exit 1
fi

echo "L1 checks passed"
exit 0
```

---

## L2：模型评估

**运行频率**：每次 PR

**特点**：
- 使用 LLM 作为裁判
- 评估输出质量
- 需要人工定义评估标准

### L2 评估维度

| 维度 | 说明 | 评估方式 |
|------|------|----------|
| 功能正确性 | 输出是否符合规格？ | AI Judge |
| 代码质量 | 是否符合项目规范？ | AI Judge |
| 安全性 | 是否有注入风险？ | 规则检查 + AI |
| 可读性 | 输出是否易于理解？ | AI Judge |

### LLM-as-Judge 架构

```
被测输出
    ↓
评估 Prompt（包含评分标准）
    ↓
LLM Judge（独立于被测 Agent）
    ↓
评分 + 理由
    ↓
通过 / 失败 / 需要修改
```

### L2 Prompt 模板

```
## 评估任务

你是代码审查专家。请评估以下生成的 SKILL.md 是否符合规范。

## 评分标准

1. **完整性**（1-5 分）
   - 是否包含所有必需字段（name, description, triggers）？
   - 是否有明确的职责描述？

2. **正确性**（1-5 分）
   - YAML 格式是否正确？
   - 字段值是否合理？

3. **可操作性**（1-5 分）
   - 触发短语是否清晰可执行？
   - 描述是否易于理解？

## 输出格式

```json
{
  "scores": {
    "completeness": 4,
    "correctness": 5,
    "actionability": 4
  },
  "overall": "PASS",
  "issues": ["问题 1", "问题 2"],
  "suggestions": ["建议 1"]
}
```
```

### L2 测试用例定义

```json
{
  "test_name": "生成符合规范的 SKILL.md",
  "prompt": "创建一个名为 'test-skill' 的 Skill，用于生成测试报告",
  "expected": {
    "name": "test-skill",
    "has_frontmatter": true,
    "has_description": true,
    "has_triggers": true
  },
  "judge_criteria": [
    "SKILL.md 包含 name 和 description 字段",
    "description 准确描述 Skill 用途",
    "triggers 包含合理的触发短语"
  ],
  "pass_threshold": 0.8
}
```

---

## L3：统计验证

**运行频率**：每周

**特点**：
- 跨多次运行分析
- 测量通过率方差
- 识别系统性模式

### L3 监控指标

| 指标 | 说明 | 正常范围 |
|------|------|----------|
| 通过率 | L2 测试通过百分比 | > 90% |
| 方差 | 通过率稳定性 | < 5% |
| 错误分布 | 错误类型分布 | 稳定 |
| Token 消耗 | 平均 Token 用量 | 稳定 |

### L3 报告模板

```markdown
## Week 2024-W15 测试报告

### 概览
- 总测试数：150
- 通过数：142
- 通过率：94.7%
- 通过率变化：-1.2%（上周 95.9%）

### 错误分布
| 错误类型 | 数量 | 占比 |
|----------|------|------|
| Schema 验证失败 | 3 | 37.5% |
| 缺少必需字段 | 2 | 25% |
| 触发短语不合理 | 2 | 25% |
| 其他 | 1 | 12.5% |

### 需要关注
- Schema 验证失败增加，需检查 evals/ 规则是否更新

### 趋势图
[通过率趋势图]
```

---

## AI 生成代码的测试要求

> 来源：[AgentPatterns.ai](https://agentpatterns.ai/training/foundations/harness-engineering/)

### 核心原则

1. **AI 生成的每个功能必须有对应测试**
2. **测试覆盖率 > 80%（行覆盖率）**
3. **关键路径必须有边界测试**
4. **禁止提交 AI 生成的无测试代码**

### 测试前置要求

```markdown
## AI 代码生成前必须确认

### 1. 理解需求
- [ ] 需求已澄清
- [ ] 假设已确认
- [ ] 成功标准已定义

### 2. 测试规划
- [ ] 单元测试已规划
- [ ] 边界情况已识别
- [ ] Mock 策略已确定

### 3. 验收标准
- [ ] 覆盖率目标：> 80%
- [ ] 关键路径：100% 覆盖
- [ ] 无警告的 Lint
```

---

## 对 cc-harness 的实现

### 目录结构

```
<skill-name>/
├── SKILL.md
├── evals/
│   ├── evals.json          # L2 测试用例
│   └── l1/
│       ├── schema-test.sh   # L1 确定性检查
│       └── format-test.sh   # L1 格式检查
└── reports/
    └── weekly-l3.md        # L3 统计报告
```

### CI 配置

```yaml
# .github/workflows/skill-tests.yml

name: Skill Tests

on:
  push:
    paths:
      - '.claude/skills/**'
  pull_request:
    paths:
      - '.claude/skills/**'

jobs:
  l1-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run L1 Checks
        run: |
          for skill in .claude/skills/*/; do
            ./scripts/validate-skill.sh "$skill"
          done

  l2-evaluation:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - name: Run LLM Evaluation
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python scripts/llm-judge.py

  l3-weekly:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'  # 每周一次
    steps:
      - uses: actions/checkout@v4
      - name: Generate L3 Report
        run: python scripts/stat-validation.py
```

---

## 测试金字塔对比

```
传统软件测试                    AI Agent 测试
┌────────┐                    ┌────────┐
│   E2E  │ ←少量              │   L3   │ ←每周
├────────┤                    ├────────┤
│集成测试│ ←中等              │   L2   │ ←每次 PR
├────────┤                    ├────────┤
│ 单元   │ ←大量              │   L1   │ ←每次 Commit
│ 测试   │                    │        │
└────────┘                    └────────┘

目的：验证代码正确执行       目的：验证 Agent+Harness 系统按预期工作
```
