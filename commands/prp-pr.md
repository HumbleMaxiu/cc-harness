---
description: 从当前分支创建 GitHub PR，包含未推送的提交 — 发现模板、分析变更、推送
argument-hint: [base-branch] (默认: main)
---

# 创建 Pull Request

> Adapted from PRPs-agentic-eng by Wirasm. Part of the PRP workflow series.

**输入**: `$ARGUMENTS` — 可选，可包含 base branch 名称和/或 flags (如 `--draft`)。

**解析 `$ARGUMENTS`**:
- 提取任何已识别的 flags (`--draft`)
- 将剩余的非 flag 文本作为 base branch 名称
- 如果未指定，默认 base branch 为 `main`

---

## 阶段 1 — VALIDATE (验证)

检查前置条件：

```bash
git branch --show-current
git status --short
git log origin/<base>..HEAD --oneline
```

| 检查 | 条件 | 失败时动作 |
|---|---|---|
| 不在 base branch | Current branch ≠ base | 停止: "Switch to a feature branch first." |
| 工作目录干净 | No uncommitted changes | 警告: "You have uncommitted changes. Commit or stash first. Use `/prp-commit` to commit." |
| 有 ahead 的提交 | `git log origin/<base>..HEAD` not empty | 停止: "No commits ahead of `<base>`. Nothing to PR." |
| 无已存在的 PR | `gh pr list --head <branch> --json number` is empty | 停止: "PR already exists: #<number>. Use `gh pr view <number> --web` to open it." |

如果所有检查通过，则继续。

---

## 阶段 2 — DISCOVER (发现)

### PR 模板

按顺序搜索 PR 模板：

1. `.github/PULL_REQUEST_TEMPLATE/` 目录 — 如果存在，列出文件并让用户选择 (或使用 `default.md`)
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `.github/pull_request_template.md`
4. `docs/pull_request_template.md`

如果找到，读取并使用其结构作为 PR 正文。

### 提交分析

```bash
git log origin/<base>..HEAD --format="%h %s" --reverse
```

分析提交以确定：
- **PR title**: 使用 conventional commit 格式带 type 前缀 — `feat: ...`, `fix: ...` 等
  - 如果有多个类型，使用主要的类型
  - 如果是单个提交，直接使用其 message
- **变更摘要**: 按 type/area 对提交分组

### 文件分析

```bash
git diff origin/<base>..HEAD --stat
git diff origin/<base>..HEAD --name-only
```

对变更文件分类: source, tests, docs, config, migrations。

### PRP 产物

检查相关 PRP 产物：
- `.claude/PRPs/reports/` — 实施报告
- `.claude/PRPs/plans/` — 已执行的计划
- `.claude/PRPs/prds/` — 相关 PRDs

如果存在，在 PR 正文中引用这些。

---

## 阶段 3 — PUSH (推送)

```bash
git push -u origin HEAD
```

如果因分歧导致推送失败：
```bash
git fetch origin
git rebase origin/<base>
git push -u origin HEAD
```

如果 rebase 发生冲突，停止并告知用户。

---

## 阶段 4 — CREATE (创建)

### 有模板

如果在阶段 2 找到了 PR 模板，填写每个部分使用提交和文件分析。保留所有模板部分 — 如果不适用则留为 "N/A" 而不是删除。

### 无模板

使用此默认格式：

```markdown
## Summary

<1-2 sentence description of what this PR does and why>

## Changes

<bulleted list of changes grouped by area>

## Files Changed

<table or list of changed files with change type: Added/Modified/Deleted>

## Testing

<description of how changes were tested, or "Needs testing">

## Related Issues

<linked issues with Closes/Fixes/Relates to #N, or "None">
```

### 创建 PR

```bash
gh pr create \
  --title "<PR title>" \
  --base <base-branch> \
  --body "<PR body>"
  # 如果从 $ARGUMENTS 解析到 --draft flag，则添加 --draft
```

---

## 阶段 5 — VERIFY (验证)

```bash
gh pr view --json number,url,title,state,baseRefName,headRefName,additions,deletions,changedFiles
gh pr checks --json name,status,conclusion 2>/dev/null || true
```

---

## 阶段 6 — OUTPUT (输出)

向用户报告：

```
PR #<number>: <title>
URL: <url>
Branch: <head> → <base>
Changes: +<additions> -<deletions> across <changedFiles> files

CI Checks: <status summary or "pending" or "none configured">

Artifacts referenced:
  - <any PRP reports/plans linked in PR body>

Next steps:
  - gh pr view <number> --web   → 在浏览器中打开
  - /code-review <number>       → 审查 PR
  - gh pr merge <number>        → 准备就绪后合并
```

---

## 边缘情况

- **无 `gh` CLI**: 停止并提示: "GitHub CLI (`gh`) is required. Install: <https://cli.github.com/>"
- **未认证**: 停止并提示: "Run `gh auth login` first."
- **需要 force push**: 如果远程有分歧且已执行 rebase，使用 `git push --force-with-lease` (永远不要 `--force`)。
- **多个 PR 模板**: 如果 `.github/PULL_REQUEST_TEMPLATE/` 有多个文件，列出它们并让用户选择。
- **大型 PR (>20 文件)**: 警告 PR 大小。如果变更可分离，建议拆分。
