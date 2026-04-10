# 验证循环：核心高 ROI 模式

> 来源：[Harness Engineering Academy](https://harnessengineering.academy)、[Skywork AI](https://skywork.ai/blog/ai-agent/how-ai-agents-complete-multi-step-tasks-step-by-step/)、[Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)

---

## 核心论点

> "Verification loops are the single highest-impact reliability improvement for most agentic systems."
> — Harness Engineering Academy

**数据支持**：
- 无验证循环：团队报告 AI 生成代码错误率 15-30%
- 有验证循环：Teams go from 83% to 96% task completion
- **ROI**：每工程小时最高可靠性的改进

---

## 什么是验证循环

验证循环是结构化验证步骤，在 Agent 产生输出后、任何 consequential 行动执行前运行。

```
Agent 产生输出
      ↓
验证层评估输出
      ↓
通过 → 继续下一步
失败 → 重试或上报
```

**这不是捕获工具调用的异常**。这是故意在成功调用后运行的验证步骤，问：
> "这个输出是否实际上包含了 Agent 继续所需的内容？"

---

## 验证循环的位置

```
用户请求
    ↓
Clarify 澄清
    ↓
Plan 规划 ──────── 验证 1：计划是否合理？
    ↓
Execute 执行 ────── 验证 2：输出是否符合 Schema？
    ↓
Test 测试 ───────── 验证 3：测试是否通过？
    ↓
Commit 提交 ─────── 验证 4：变更是否安全？
    ↓
Audit 审计
```

---

## 验证类型

### 1. Schema 验证（Computational）

**问题**：输出是否符合预期结构？

```python
import jsonschema

def validate_tool_output(tool_name: str, output: dict) -> tuple[bool, str]:
    """验证工具输出符合 Schema"""
    schemas = {
        "create_file": {
            "type": "object",
            "required": ["path", "content"],
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            }
        }
    }

    try:
        validate(instance=output, schema=schemas[tool_name])
        return True, ""
    except ValidationError as e:
        return False, str(e)
```

### 2. 语义验证（Inferential）

**问题**：输出在逻辑上是否合理？

```python
def semantic_check(task: str, output: dict) -> tuple[bool, list[str]]:
    """检查输出语义是否合理"""
    issues = []

    # 检查 1：输出是否完整
    if "missing_fields" in output and output["missing_fields"]:
        issues.append(f"输出缺少必需字段: {output['missing_fields']}")

    # 检查 2：值是否在合理范围内
    if "count" in output and output["count"] < 0:
        issues.append("count 不能为负数")

    # 检查 3：与其他系统一致性
    if output.get("status") == "refunded" and output.get("amount") > 0:
        issues.append("已退款的订单金额应为 0")

    return len(issues) == 0, issues
```

### 3. AI Judge 验证（Inferential）

**问题**：输出是否满足质量标准？

```python
def llm_judge_verification(
    task: str,
    output: str,
    criteria: list[str]
) -> tuple[bool, dict]:
    """使用 LLM 作为裁判评估输出"""

    judge_prompt = f"""
    任务：{task}

    输出：{output}

    评估标准：
    {chr(10).join(f"- {c}" for c in criteria)}

    对每个标准给出 PASS/FAIL，并提供简短理由。
    """

    response = claude.messages.create(
        model="claude-opus",
        max_tokens=500,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    return parse_judge_response(response.content)
```

---

## 验证失败处理

### 决策树

```
验证失败
    │
    ├─ 可重试失败？
    │   ├─ 是（超时、网络错误）
    │   │   └─ 重试（最多 2-3 次，指数退避）
    │   └─ 否（逻辑错误）
    │       ├─ 可修复？
    │       │   ├─ 是 → 修复并重试验证
    │       │   └─ 否 → 上报人工
    │       └─ 风险可接受？
    │           ├─ 是 → 记录并继续（有告警）
    │           └─ 否 → 停止并上报
```

### 重试策略

```python
def execute_with_retry(
    tool: str,
    input_data: dict,
    max_retries: int = 3
) -> dict:
    """带指数退避的重试执行"""

    for attempt in range(max_retries):
        try:
            result = execute_tool(tool, input_data)

            # 验证输出
            is_valid, error = validate_tool_output(tool, result)
            if is_valid:
                return result

            # 验证失败，但不重试
            if attempt == max_retries - 1:
                return {"error": error, "status": "validation_failed"}

        except TransientError as e:
            wait_time = 2 ** attempt  # 指数退避
            time.sleep(wait_time)
            continue

    return {"error": "max_retries_exceeded", "status": "failed"}
```

---

## 验证循环的成本与收益

| 指标 | 无验证循环 | 有验证循环 |
|------|-----------|-----------|
| 平均任务时间 | 100% | 110-130% |
| 错误率 | 15-30% | 2-5% |
| 调试时间 | 高 | 极低 |
| 团队信心 | 低 | 高 |

**结论**：验证循环增加 10-30% 执行时间，但减少 80-90% 错误率。

---

## 验证循环实现清单

```markdown
## 验证循环实现清单

### 外部工具调用
- [ ] 每次工具调用后验证输出 Schema
- [ ] 检查必需字段是否存在
- [ ] 验证值类型是否正确

### LLM 输出
- [ ] 验证 JSON 格式（如果期望结构化输出）
- [ ] 使用 AI Judge 评估质量（如适用）
- [ ] 检查输出是否包含已知错误信号

### 代码生成
- [ ] 运行类型检查（tsc / mypy）
- [ ] 运行 Lint（ESLint / Pylint）
- [ ] 运行单元测试
- [ ] 检查构建是否成功

### 文档生成
- [ ] 验证必需章节存在
- [ ] 验证 Markdown 格式正确
- [ ] 验证内容与任务相关

### 高风险操作
- [ ] 人工批准门控
- [ ] 回滚计划已准备
- [ ] 影响范围已评估
```

---

## 验证循环的常见失败

| 失败模式 | 原因 | 解决方案 |
|----------|------|----------|
| 验证循环产生假阳性 | 验证太宽松 | 收紧验证规则 |
| 验证循环成为瓶颈 | 验证太慢 | 分离快/慢验证 |
| 验证失败但继续 | 缺少硬性门控 | 添加 if !valid then stop |
| 验证消息无用 | 错误消息太模糊 | 提供具体修复建议 |

---

## 对 cc-harness 的实现建议

### SKILL.md 验证

```yaml
# 每个 Skill 的 SKILL.md 应定义验证点
verifications:
  - stage: "execute"
    type: "schema"
    check: "SKILL.md frontmatter 存在"
    tool: "jsonschema"

  - stage: "execute"
    type: "schema"
    check: "必需字段存在（name, description）"
    tool: "jsonschema"

  - stage: "validate"
    type: "llm_judge"
    check: "生成内容符合任务要求"
    model: "claude-sonnet"
```

### evals/ 测试框架

```json
{
  "test_name": "生成符合规范的 SKILL.md",
  "verifications": [
    {
      "type": "computational",
      "check": "frontmatter.name 存在且非空",
      "expected": "pass"
    },
    {
      "type": "computational",
      "check": "frontmatter.description 存在且非空",
      "expected": "pass"
    },
    {
      "type": "inferential",
      "check": "生成内容与任务相关",
      "criteria": [
        "包含必需的 YAML 字段",
        "description 准确描述 Skill 职责",
        "无内部路径泄漏"
      ]
    }
  ]
}
```
