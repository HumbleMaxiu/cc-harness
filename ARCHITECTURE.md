# 架构 — cc-harness

`cc-harness` 是 source-first 的 harness 仓库。仓库中只保存可复用的 skills、hook scripts、install 逻辑和文档。Host-specific runtime folders 由安装过程生成，不提交到仓库。

## Source Tree

```text
cc-harness/
├── AGENTS.md
├── README.md
├── install.sh
├── package.json
├── skills/
│   ├── pm-orchestrator/
│   ├── doc-sync/
│   ├── architect/
│   ├── developer/
│   ├── reviewer/
│   ├── tester/
│   └── ...
├── scripts/
│   ├── install.mjs
│   ├── hooks/
│   └── checks/
└── docs/
    ├── guides/
    ├── product-specs/
    ├── design-docs/
    ├── exec-plans/
    ├── memory/
    └── references/
```

## Runtime 安装

安装器会把 source tree 投射到对应 host runtime：

| Host | 目标项目中的生成位置 | 使用的 source |
|------|-----------------------------|-------------|
| Claude Code | `.claude/skills`, `.claude/scripts/hooks`, `.claude/settings.json` | `skills/`, `scripts/hooks/` |
| Codex | `.codex/skills`, `.codex/scripts/hooks`, `.codex/config.toml`, `.codex/hooks.json` | `skills/`, `scripts/hooks/` |

这些生成目录是 install artifacts，不定义仓库的 source model。

## Role Model

旧的独立 role definition 已转换为普通 skills：

- `/architect`
- `/challenger`
- `/developer`
- `/reviewer`
- `/tester`
- `/feedback-curator`

`/pm-orchestrator` 通过 contract 协调这些 role skills。它负责阶段控制、skill 分配、失败回流、并行/串行策略和最终 handoff；可以要求 host inline 执行或委托执行某个 role skill，但不再依赖 host-specific role definition files。

## Hook Model

`scripts/hooks/` 存放共享 hook runtime。安装器会写入 host-specific hook configuration：

- Claude Code hooks 使用 `.claude/settings.json`
- Codex hooks 使用 `.codex/hooks.json`，并要求 `codex_hooks = true`

这些 hook scripts 保持 fail-open：如果 payload parsing、path resolution 或 plan lookup 失败，它们会避免阻塞 host，并在已配置时记录有用 context。

## 验证

当前 source tree 没有 repo-local test/check script。验证安装行为时，运行 `./install.sh --target both --dest <target-project>`，并检查生成的 Claude Code / Codex runtime 文件。
