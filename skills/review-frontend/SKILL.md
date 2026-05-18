---
name: review-frontend
description: 用于审查 UI components、pages、forms、navigation、loading/error/empty states、accessibility、responsive 和 visual behavior 变更；当 /pm-orchestrator 或用户需要前端专项 review 时使用。
---

# Frontend Review

`review-frontend` 是只读专项 review pack。它审查 UI 行为、可访问性、状态流和响应式风险，不替代 `/tester`、`/ui-verify` 或真实浏览器验证。

## Source

本 skill 轻量自研，参考 axe-core、Pa11y、Lighthouse CI 和 Playwright/webapp verification 的证据模式作为可选工具槽。来源、license、不可变 source snapshot 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 UI components、pages、layouts、forms、navigation。
- 变更涉及 loading、empty、error、disabled、optimistic states。
- 变更涉及 keyboard interaction、focus management、ARIA、semantic HTML。
- 变更涉及 responsive layout、text overflow、visual behavior 或 design-system changes。

## 何时不要使用

- 需要新的浏览器点击、截图或视觉验收证据：如果已安装，使用 `/ui-verify`；否则在本 review 中写入 `needs_verification`。`/tester` 只用于项目原生可执行检查，不替代浏览器视觉验收。
- 普通业务逻辑审查：使用 `/reviewer`。
- 安全专项审查：如果已安装，使用 `/review-security`；否则回退 `/reviewer` 并在结果中说明缺少专项 pack。
- performance 专项审查：如果已安装，使用 `/review-performance`；否则回退 `/reviewer` 并在结果中说明缺少专项 pack。
- 需要修改 UI 代码：回流 `/developer`，本 skill 只读。

## 输入 / 读取项

- UI diff、component/page files、styles、tests、stories、design refs。
- PM policy、plan refs、Developer Result。
- 可选验证证据：axe-core、Pa11y、已有 Playwright/webapp testing 输出、browser screenshots、component tests、storybook output。

## 执行流程

1. 定义 changed UI surface：user action、visible state、affected viewport 或 assistive tech surface。
2. 阅读组件调用方、state owner、form handlers、styles 和 tests/stories。
3. 检查 state transitions、stale state、loading/empty/error/disabled/success 状态是否完整且不会互相遮挡。
4. 检查 forms：validation、error display、submit/disabled/loading path 和 duplicate action risk。
5. 检查 keyboard access、focus return、accessible name、semantic roles。
6. 检查 responsive constraints、text wrapping、overflow、hit target 和 design-system consistency。
7. 检查 user-visible copy 是否与状态、错误和设计语义一致。
8. 检查 tests/stories 是否覆盖重要 UI states；缺失时写入 `needs_verification` 或 non-blocking finding，视风险而定。
9. 对缺少真实浏览器证据的高风险视觉问题，写入 `needs_verification`。
10. 工具输出必须映射到具体 UI surface 并经过人工复核；无法定位的工具告警写入 `needs_verification` 或 `false_positive_notes`，不要单独作为 blocking finding。
11. 输出 `Review Handoff`。

## 输出格式

```markdown
### Review Handoff
- capability: frontend_review
- source_skill: /review-frontend
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
- UI behavior depends on unavailable design/spec context and the requested review scope cannot be judged without it.
- Component contract is unclear, caller context is missing, and the affected user path cannot be determined.
- Browser-only evidence is unavailable: do not block on that alone; record the risk under `needs_verification` unless missing context prevents scope review.
- Tool output cannot be mapped to a component, route, viewport or interaction: do not block on the tool output alone; record it under `needs_verification` or `false_positive_notes`.

## 可选证据来源

- `axe-core` or Pa11y for accessibility evidence.
- Existing Playwright or webapp testing output for interaction evidence; this skill consumes evidence, it does not create new browser runs.
- Existing browser screenshots for visual risk.
- Project-native component tests or stories.
