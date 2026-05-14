# Skill Standard Sources

> `/skill-audit` 的运行时标准摘要来自这些调研结论。完整调研在仓库源目录 `docs/references/skill-standard-research.md`。

## External Sources

- Open Agent Skills / Anthropic skills：采用一个目录一个 `SKILL.md`、YAML frontmatter、`name` / `description`、`references/` / `scripts/` / `assets/` 和 progressive disclosure。
- Supabase agent-skills：采用目录名匹配 `name`、description 同时说明能力和触发场景、测试/发布 discipline。
- Sentry skills：采用 repo-root `skills/` 作为 source，skill writer 关注 source capture、output contract、registration validation。
- Superpowers：采用 pressure scenarios 和 RED / GREEN / REFACTOR 的 skill behavior testing 思路。
- Trail of Bits skills：采用 workflow skill design、skill improver severity、review pack capability registry 的思路。

## Local cc-harness Additions

- Docs-first：skill 要说明读取或维护哪些 docs。
- Codex compatibility：不能把 Claude-only 假设写成唯一执行路径。
- Output contract：workflow / review / test / audit skill 必须输出可消费结果。
- Feedback / memory boundary：当前任务指令不能自动进入长期 memory。
- Installable runtime portability：安装/分发/跨项目复用的 skill 不能依赖不会被 installer 复制的 repo-level docs/scripts 作为唯一运行依赖。
- Third-party source attribution：三方来源 skill 必须记录 source URL、license、commit 和 local changes。
- PM gate compatibility：审计必须能区分当前 scope warnings 和 unrelated historical warnings。
