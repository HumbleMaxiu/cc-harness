---
name: review-performance
description: 用于审查 hot paths、queries、cache、pagination、API fan-out、large lists、bundle size 和 expensive render/computation 的性能风险；当 /pm-orchestrator 或用户需要性能专项 review 时使用。
---

# Performance Review

`review-performance` 是只读专项 review pack。它审查高信号性能风险，不做完整 profiling，不替代 benchmark，也不报告没有证据的微优化建议。

## Source

本 skill 轻量自研，参考 Lighthouse CI、size-limit、bundle analyzer 和项目原生 benchmark/profiling 的证据模式作为可选工具槽。来源、license、不可变 source snapshot 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 hot paths、loops、queries、pagination、cache、background jobs。
- 变更涉及 API fan-out、network calls、serialization、expensive computation。
- 变更涉及 frontend render path、large lists、images/media、bundle size。
- 变更新增大型 dependency 或 runtime-heavy code。

## 何时不要使用

- 普通代码质量审查：使用 `/reviewer`。
- 安全风险审查：如果已安装，使用 `/review-security`；否则回退 `/reviewer` 并在结果中说明缺少专项 pack。
- UI correctness/a11y 审查：如果已安装，使用 `/review-frontend`；否则回退 `/reviewer` 并在结果中说明缺少专项 pack。
- 需要完整 profiling、capacity planning 或 benchmark 设计：回流 `/developer`、`/tester` 或项目性能流程；本 skill 只做 review。
- 需要实际 benchmark 或 profiling 才能判断且没有证据：写入 `needs_verification`，不要作为 blocking finding。

## 输入 / 读取项

- Diff、changed files、call sites、query paths、cache keys、tests、benchmarks。
- PM policy、plan refs、Developer Result。
- 可选证据：Lighthouse CI、size-limit、bundle analyzer、project-native benchmarks、EXPLAIN plans。

## 执行流程

1. 定义 performance-sensitive surface：request path、UI render path、job path、query path 或 bundle path。
2. 阅读 caller/callee context，判断是否 hot path 或 data-size dependent。
3. 检查 N+1 queries、unbounded reads、missing pagination、unbounded loops。
4. 检查 cache key、invalidation、accidental bypass、API fan-out。
5. 检查 frontend re-render、large list handling、image/media loading、bundle impact。
6. 工具输出必须映射到具体 path、query、bundle entry 或 user-facing surface 并经过人工复核；无法定位的工具告警写入 `needs_verification` 或 `false_positive_notes`，不要单独作为 blocking finding。
7. 没有明确 impact 的微优化建议不要 blocking；写入 `reviewed_and_cleared` 或 `needs_verification`。
8. 输出 `Review Handoff`。

## 输出格式

```markdown
### Review Handoff
- capability: performance_review
- source_skill: /review-performance
- review_scope:
- files_reviewed:
- context_read:
- tools_available:
- tools_run:
- findings:
  - id:
    severity: CRITICAL / HIGH / MEDIUM / LOW
    confidence: HIGH / MEDIUM / LOW
    blocking: true / false
    location:
    evidence:
    impact:
    recommendation:
    verification:
- needs_verification:
- reviewed_and_cleared:
- false_positive_notes:
- status: APPROVED / REJECTED / BLOCKED
```

## 暂停 / 阻塞条件

- PM 没有提供 diff、changed files 或 review scope。
- Performance claim depends on unavailable production metrics or profiling artifacts and the requested review scope cannot be judged without them.
- Query/schema/caller context is unavailable and prevents review of the requested scope.
- The requested review would require running expensive external benchmarks.
- Tool output cannot be mapped to code, query, route, bundle entry or workload: do not block on the tool output alone; record it under `needs_verification` or `false_positive_notes`.

## 可选证据来源

- Project-native benchmarks or performance tests.
- Lighthouse CI for web performance evidence.
- `size-limit` or bundle analyzer for frontend bundle impact.
- Database EXPLAIN plans when repo conventions support them.
