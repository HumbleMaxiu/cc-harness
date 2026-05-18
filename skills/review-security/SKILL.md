---
name: review-security
description: 用于审查涉及 auth、permissions、secrets、tenant boundary、injection、external request、shell/SQL execution、dependency risk 的代码变更；当 /pm-orchestrator 或用户需要高置信安全审查时使用。
---

# Security Review

`review-security` 是只读专项 review pack。它不替代 `/reviewer`，也不修改代码；它只在高风险安全变更中输出高置信 `Review Handoff`。

## Source

本 skill 轻量自研，参考 Sentry `security-review` 的 high-confidence review discipline，并将 Semgrep、Gitleaks、OSV-Scanner 作为可选工具槽。来源、license 和本地取舍见 `references/source.md`。行为压力场景见 `references/pressure-scenarios.md`。

## 何时使用

- 变更涉及 auth、authorization、permissions、tenant boundary、admin actions。
- 变更涉及 secrets、tokens、sessions、crypto、payment、billing。
- 变更涉及 request parsing、redirects、external requests、file upload/download。
- 变更涉及 SQL/NoSQL query、shell execution、template rendering、unsafe deserialization。
- 变更涉及 dependency、lockfile 或 package manager config，且尚无专门 supply-chain pack。

## 何时不要使用

- 普通代码风格、架构或测试质量审查：使用 `/reviewer`。
- GitHub Actions workflow 安全审查：如果已安装，使用 `/review-github-actions`；否则回退 `/reviewer` 并在结果中说明缺少专项 pack。
- UI 状态、a11y、responsive 审查：如果已安装，使用 `/review-frontend`；否则回退 `/reviewer`。
- 性能风险审查：如果已安装，使用 `/review-performance`；否则回退 `/reviewer`。
- 需要修复代码：回流 `/developer`，本 skill 只读。

## 输入 / 读取项

- `git diff` 或 PM 提供的 changed files。
- `plan_path`、`task_id`、`step_scope`、spec refs 和 Developer Result。
- 相关路由、handler、model、schema、middleware、policy、config、tests。
- `docs/memory/feedback/prevents-recurrence.md`，如果存在。
- 可选工具输出：Semgrep、Gitleaks、OSV-Scanner 或项目原生 security checks。

## 执行流程

1. 定义 review scope：列出 changed files、security-sensitive paths 和需要读取的上下文。
2. 从 diff 出发寻找 source、sink、trust boundary 和 mitigation。
3. 区分 attacker-controlled input、trusted service config、repo-local constants 和 framework-protected output。
4. 只在能连接 `source -> data flow -> missing mitigation -> impact` 时报告 blocking finding。
5. 没有完整 exploit path 的疑点写入 `needs_verification`，不要包装成 blocking finding。
6. 如果可用，运行或引用 Semgrep、Gitleaks、OSV-Scanner；工具输出必须经过人工高置信复核。
7. 输出 `Review Handoff`。

## 输出格式

```markdown
### Review Handoff
- capability: security_review
- source_skill: /review-security
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
- 关键上下文不可读，导致无法判断 trust boundary。
- 工具输出声称 critical 但无法定位代码证据时，不要阻塞；放入 `needs_verification` 或 `false_positive_notes`。只有缺失上下文导致无法审查请求范围时才 `BLOCKED`。
- 用户要求执行会产生外部副作用的扫描或上传。

## 可选工具

- `semgrep`：模式扫描，不能替代 data-flow reasoning。
- `gitleaks`：secret 扫描。
- `osv-scanner`：依赖漏洞扫描。
- 项目原生 security checks。
