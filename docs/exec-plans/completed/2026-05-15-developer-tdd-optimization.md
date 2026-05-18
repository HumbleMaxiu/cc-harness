# Developer And TDD Optimization Implementation Plan

> **面向代理工作者：** 必需执行入口：使用 `/pm-orchestrator` 执行实施计划。步骤使用复选框（`- [x]`）语法进行跟踪。

**目标：** 重写 `/developer` 为轻量、stack-aware 的单 slice 实现者，并新增独立 `/tdd` skill 负责 RED/GREEN/REFACTOR 纪律。

**架构：** `/pm-orchestrator` 负责判断 implementation 阶段是否要求 TDD 以及是否允许例外；`/developer` 负责执行一个明确 task / slice，并在需要行为变更时调用 `/tdd` 的协议；`/tdd` 负责 TDD 规则、例外格式和证据输出。Developer 先读取内置实践，再读取用户 repo 约定；两者都没有时直接使用 Codex 对当前代码库的推断，不联网、不阻塞。

**技术栈：** Markdown skills、cc-harness Skill Standard、三方 source attribution、Node.js skill audit scripts、install smoke。

---

## 运行约束

- 不修改 `/brainstorming`、`/writing-plans` 的主流程。
- 不让 `/developer` 自己联网搜索最佳实践；外部搜索未来由 PM 调度 scout/research skill。
- 不把完整交接文档留在 `/developer`；PM Run Trace 和最终 handoff 负责汇总。
- 不把所有语言 / 框架测试实践塞进 `/developer`；只内置技术栈识别和测试入口发现规则。
- 本计划创建或重大修改 installable skills，必须读取并满足 `docs/references/skill-standard.md`，并运行 targeted audit、repo audit 和 install smoke。
- 当前仓库已有未提交的 `/plan-review` 相关变更；实施时必须只在本计划范围内增量修改，不得回滚或重写已有变更。

## 设计决策

- 保留 `/developer` 名称。它已经是 PM routing 和文档中的 role skill；本次改变定位，不改入口名。
- 新增 `/tdd`，而不是把 TDD 完整写进 `/developer`。TDD 是横切 discipline，未来 bugfix、refactor、skill pressure scenarios 都可以复用。
- 控制权分层：
  - `/pm-orchestrator`：决定 `tdd_required`、`tdd_exception_allowed`、失败回流。
  - `/developer`：在当前 slice 内执行 TDD 或记录例外。
  - `/tdd`：定义 RED/GREEN/REFACTOR、Prove-It Pattern、TDD exception 和证据格式。
  - `/tester`：做实现后的独立验证，不替代 TDD。
- 开源来源：
  - 主源：`obra/superpowers` 的 `skills/test-driven-development/SKILL.md`，MIT，imported commit `f2cbfbefebbfef77321e4c9abc9e949826bea9d7`。
  - 补充源：`addyosmani/agent-skills` 的 `skills/test-driven-development/SKILL.md`、`skills/incremental-implementation/SKILL.md`、`skills/context-engineering/SKILL.md`，MIT，imported commit `5b4c6dade5e6b5a48067d08861a11732d8e3a2bf`。
  - 只借鉴模式：`github/spec-kit` task structure、`buildermethods/agent-os` standards injection、`bmad-code-org/BMAD-METHOD` ready story / AC discipline、`modu-ai/moai-adk` boundary verification。

## 文件职责

- 创建 `skills/tdd/SKILL.md`：独立 TDD discipline，定义适用场景、TDD cycle、例外、证据输出和阻塞条件。
- 创建 `skills/tdd/references/source.md`：记录 Superpowers 和 agent-skills 来源、license、commit 和本地改编。
- 创建 `skills/tdd/references/pressure-scenarios.md`：覆盖无 RED 直接实现、测试立即通过、bugfix 无复现测试、配置/doc 例外未记录、过度 mock。
- 重写 `skills/developer/SKILL.md`：去掉交接文档，改为 stack-aware slice executor，输出轻量 `Developer Result`。
- 创建 `skills/developer/references/stack-detection.md`：内置技术栈和测试入口识别规则。
- 创建 `skills/developer/references/pressure-scenarios.md`：覆盖 repo 约定优先、无内置/无 repo 约定时使用 Codex 推断、计划外扩 scope、边界只测单侧、找不到测试入口。
- 修改 `skills/pm-orchestrator/SKILL.md`：implementation routing 增加 `/tdd`，新增 TDD policy 和失败回流。
- 修改 `scripts/checks/skill-standard.mjs` 与 `skills/skill-audit/scripts/skill-standard.mjs`：把 `developer` 和 `tdd` 加入 key skills。
- 修改 `README.md`、`AGENTS.md`、`docs/guides/harness-guide.md`、`docs/product-specs/skill-system.md`、`docs/product-specs/agent-system.md`、`docs/PLANS.md`：同步 `/developer` 与 `/tdd` 定位。
- 修改 `docs/exec-plans/index.md`：本计划开始时加入 Active，完成后移到 Completed。

### 任务 1：建立 RED 检查并新增 `/tdd`

**文件：**
- 创建：`skills/tdd/SKILL.md`
- 创建：`skills/tdd/references/source.md`
- 创建：`skills/tdd/references/pressure-scenarios.md`
- 修改：`scripts/checks/skill-standard.mjs`
- 修改：`skills/skill-audit/scripts/skill-standard.mjs`

- [x] **步骤 1：运行 RED 检查**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill tdd --json
```

预期：FAIL，JSON 中包含 `skill not found: tdd`。如果已经存在，先审查现有实现，不覆盖用户变更。

- [x] **步骤 2：创建 `/tdd` skill**

创建 `skills/tdd/SKILL.md`，内容如下：

```markdown
---
name: tdd
description: 用于实现行为变更、修复 bug、重构或新增边界处理前执行测试驱动开发；当 /pm-orchestrator 要求 TDD，或 /developer 开始代码实现 slice 时使用。
---

# TDD

`tdd` 定义 RED / GREEN / REFACTOR 纪律。它不选择业务范围，不替代 `/tester`，也不做最终 code review；它只保证实现前有能证明目标行为的测试证据。

## Source

本 skill 改编自 Superpowers `test-driven-development`，并吸收 Addy Osmani `agent-skills` 中的 Prove-It Pattern、测试金字塔、DAMP over DRY 和 incremental implementation 思路。来源、license 和本地改动记录在 `references/source.md`。

## 何时使用

- 新功能、bugfix、重构、行为变更、边界条件处理。
- `/pm-orchestrator` 的 PM policy 标记 `tdd_required: true`。
- `/developer` 即将修改生产代码，且本次 slice 会改变运行行为。
- 需要证明 bug 已复现再修复。

## 何时不要使用

- 纯文档、纯注释、纯配置、格式化、安装产物同步，且 PM 允许 TDD exception。
- 生成代码或一次性 spike，但必须在结果中记录 `tdd_exception`。
- 已实现行为的独立验收：使用 `/tester`。

## 输入 / 读取项

- 当前 plan task / slice、acceptance criteria、spec refs。
- 相关源文件、相邻测试、测试配置和 package/tooling 文件。
- `/developer` 或 PM 提供的技术栈识别结果。
- 失败输出和修复后的验证输出。

## 执行流程

1. 确认当前 slice 是否是行为变更；不是行为变更时输出 `tdd_exception`。
2. RED：写一个最小、具体、能表达目标行为或 bug 的测试。
3. Verify RED：运行最小相关测试，确认失败原因是目标行为缺失或 bug 存在，而不是语法错误、导入错误或测试写错。
4. GREEN：写最小实现让该测试通过，不做计划外重构或额外功能。
5. Verify GREEN：重新运行同一测试，并按风险运行相邻测试。
6. REFACTOR：只有在 GREEN 后才清理命名、重复和局部结构；每次 refactor 后重新验证。
7. 输出结构化 TDD evidence。无法找到测试入口、RED 失败原因不正确、GREEN 无法通过或需求不清时返回 `BLOCKED`。

## 输出格式

```markdown
### TDD Result
- capability: tdd
- source_skill: /tdd
- slice:
- tdd_required: true / false
- tdd_exception:
- red_test:
- red_command:
- red_result:
- green_changes:
- green_command:
- green_result:
- refactor:
- adjacent_verification:
- status: PASS / FAIL / BLOCKED
```

## 暂停 / 阻塞条件

- 无法确定目标行为或验收标准。
- 找不到可运行测试入口，且 repo 没有可推断测试命令。
- RED 测试立即通过。
- RED 失败不是因为目标行为缺失。
- GREEN 需要扩大 scope、改架构或触碰 PM 未授权文件。

## Feedback / Memory Boundary

TDD 失败和修复证据默认只进入本轮 handoff evidence。只有重复出现的 TDD 违规、用户明确要求记录，或发现会约束未来类似任务的流程规则时，才交给 `/feedback-curator` 判断是否持久化。
```

- [x] **步骤 3：创建 `/tdd` source attribution**

创建 `skills/tdd/references/source.md`：

```markdown
# TDD Source Attribution

## Primary Imported Source

- Source project: `obra/superpowers`
- Source skill/path: `skills/test-driven-development/SKILL.md`
- Source URL: `https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md`
- License: MIT License
- Imported commit: `f2cbfbefebbfef77321e4c9abc9e949826bea9d7`
- Import date: `2026-05-15`
- Local skill name: `tdd`
- Local changes: Converted Superpowers TDD discipline into a cc-harness installable skill; added PM/Developer control split, TDD exception format, `TDD Result` output, feedback boundary and install portability.
- Compatibility notes: Runtime files needed by `/tdd` live inside `skills/tdd/`; external projects are attribution and design sources, not runtime dependencies.

## Supplemental Source

- Source project: `addyosmani/agent-skills`
- Source skill/path: `skills/test-driven-development/SKILL.md`; `skills/incremental-implementation/SKILL.md`; `skills/context-engineering/SKILL.md`
- Source URL: `https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md`; `https://github.com/addyosmani/agent-skills/blob/main/skills/incremental-implementation/SKILL.md`; `https://github.com/addyosmani/agent-skills/blob/main/skills/context-engineering/SKILL.md`
- License: MIT License
- Imported commit: `5b4c6dade5e6b5a48067d08861a11732d8e3a2bf`
- Import date: `2026-05-15`
- Local changes: Borrowed the Prove-It Pattern, small/medium/large test framing, DAMP-over-DRY test guidance and incremental slice discipline as local review lenses.
- Compatibility notes: Supplemental source is not a runtime dependency.

## Reviewed But Not Imported

- `github/spec-kit`: useful task structure and tests-before-implementation language; not copied into `/tdd`.
- `buildermethods/agent-os`: useful standards injection model; used in `/developer` stack-practice loading, not `/tdd`.
- `bmad-code-org/BMAD-METHOD`: useful ready-story and acceptance-criteria discipline; not copied because runtime is BMAD-specific.
- `modu-ai/moai-adk`: useful boundary verification idea; not copied into `/tdd`.
```

- [x] **步骤 4：创建 `/tdd` pressure scenarios**

创建 `skills/tdd/references/pressure-scenarios.md`：

```markdown
# TDD Pressure Scenarios

## Scenario 1: Implementation Before RED

- skill_under_test: `/tdd`
- pressure: agent 说“这个改动很小，我先实现再补测试”。
- expected_behavior: 返回 `BLOCKED` 或要求删除实现并先写 RED 测试。
- rationalization_to_reject: “小改动不值得先写测试。”

## Scenario 2: RED Test Passes Immediately

- skill_under_test: `/tdd`
- pressure: 新测试第一次运行就通过，agent 想继续实现。
- expected_behavior: 返回 `BLOCKED`，要求修正测试或确认行为已存在。
- rationalization_to_reject: “测试通过说明没问题。”

## Scenario 3: Bug Fix Without Reproduction

- skill_under_test: `/tdd`
- pressure: bug report 已清楚，agent 想直接修。
- expected_behavior: 要求先写能复现 bug 的失败测试。
- rationalization_to_reject: “我已经知道 bug 在哪里。”

## Scenario 4: Legitimate Exception

- skill_under_test: `/tdd`
- pressure: 只更新 README 文案或静态配置，没有运行行为变化。
- expected_behavior: 输出 `tdd_exception`，说明原因和替代验证。
- rationalization_to_reject: “没有测试就等于流程失败。”

## Scenario 5: Over-Mocking

- skill_under_test: `/tdd`
- pressure: 测试只验证 mock 被调用，没有验证行为结果。
- expected_behavior: 返回 `FAIL` 或要求改成 state/output/assertion-based 测试。
- rationalization_to_reject: “mock call count 已经证明代码执行了。”
```

- [x] **步骤 5：更新 key skill 检查**

在 `scripts/checks/skill-standard.mjs` 和 `skills/skill-audit/scripts/skill-standard.mjs` 的 `keySkills` 中加入：

```js
"developer",
"tdd",
```

- [x] **步骤 6：运行 `/tdd` GREEN 检查**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill tdd --json
```

预期：`summary.errors` 为 `0`，`summary.warnings` 为 `0`。

### 任务 2：重写 `/developer` 为 stack-aware slice executor

**文件：**
- 修改：`skills/developer/SKILL.md`
- 创建：`skills/developer/references/stack-detection.md`
- 创建：`skills/developer/references/pressure-scenarios.md`

- [x] **步骤 1：替换 `/developer` 主文档**

把 `skills/developer/SKILL.md` 替换为：

```markdown
---
name: developer
description: 用于 /pm-orchestrator 分配明确 implementation slice 后执行代码实现；当任务有 plan_path、task_id、step_scope、允许文件范围和验证要求时使用。
---

# Developer

`developer` 是 PM 调度下的轻量实现者。它不负责写完整交接文档，不做独立 code review，不决定需求范围；它只执行一个明确 slice，遵守 repo 约定和 TDD policy，并输出可被 PM 消费的 `Developer Result`。

## 何时使用

- `/pm-orchestrator` 已分配明确的 `plan_path`、`task_id`、`step_scope` 和文件 ownership。
- 需要实现一个小的 feature slice、bugfix slice、refactor slice 或测试修复 slice。
- 当前任务需要先识别 repo 技术栈、测试入口和本地实现约定。

## 何时不要使用

- 需求不清或还在探索：回到 `/brainstorming`。
- 计划缺步骤、缺测试或范围模糊：回到 `/writing-plans` 或 `/plan-review`。
- 需要独立代码审查：使用 `/reviewer`。
- 需要黑盒验证或测试套件探测：使用 `/tester`。
- 需要文档同步：使用 `/doc-sync`。

## 输入 / 读取项

- PM policy：`plan_path`、`task_id`、`step_scope`、`files_allowed`、`tdd_required`、`tdd_exception_allowed`。
- 当前 task 引用的 spec、acceptance criteria 和 plan steps。
- 内置实践：`references/stack-detection.md`。
- 用户 repo 约定：`AGENTS.md`、`docs/conventions/`、`docs/memory/feedback/prevents-recurrence.md`、相关测试配置和同类实现文件。

## 执行流程

1. 确认 slice 边界：只处理 PM 分配的 task / step_scope；范围不清时 `BLOCKED`。
2. 识别技术栈和测试入口：先读内置 `references/stack-detection.md`，再读用户 repo 的配置、CI、测试目录和同类文件。
3. 选择实践来源：
   - `built_in`: 内置实践足够。
   - `repo_conventions`: 用户 repo 有明确约定，repo 约定优先。
   - `codex_inference`: 内置和 repo 都没有明确实践时，使用 Codex 对当前代码库的推断继续实现。
4. 读取待修改文件、相邻测试和一个相似实现例子。
5. 如果 `tdd_required: true` 或本 slice 是行为变更，使用 `/tdd` 协议执行 RED/GREEN/REFACTOR。
6. 只做最小实现；不要计划外重构、现代化语法、移动文件或新增依赖。
7. 运行最小相关验证；按 PM policy 或风险扩大到 lint、typecheck、build。
8. 输出轻量 `Developer Result`；不要写单独交接文档文件。

## 输出格式

```markdown
### Developer Result
- capability: implementation
- source_skill: /developer
- plan_path:
- task_id:
- step_scope:
- files_touched:
- practice_source: built_in / repo_conventions / codex_inference
- stack_detected:
- tdd_result:
- commands_run:
- verification:
- docs_impact:
- scope_changes:
- blockers:
- status: PASS / FAIL / BLOCKED
```

## 暂停 / 阻塞条件

- 没有明确 `task_id` / `step_scope` / 文件 ownership。
- plan 要求修改 PM 未授权文件。
- repo 约定和计划冲突，无法安全选择。
- TDD RED 失败原因不正确、测试入口无法推断或 GREEN 需要扩大 scope。
- 实现需要架构决策、外部副作用、不可逆操作或新增依赖但 PM 未授权。

## 可调用 Skills

- `/tdd`：行为变更、bugfix、refactor 的 RED/GREEN/REFACTOR discipline。
- `/tester`：需要独立验证或更大测试面时由 PM 调度；developer 不直接替代 tester。
```

- [x] **步骤 2：创建 stack detection reference**

创建 `skills/developer/references/stack-detection.md`：

```markdown
# Developer Stack Detection

## Detection Order

1. Read PM-provided `files_allowed`, `plan_path`, `task_id` and `step_scope`.
2. Read repo-level rules: `AGENTS.md`, `docs/conventions/`, `docs/memory/feedback/prevents-recurrence.md`.
3. Inspect package and tool files:
   - JavaScript / TypeScript: `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`, `vite.config.*`, `next.config.*`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*`
   - Python: `pyproject.toml`, `requirements*.txt`, `pytest.ini`, `tox.ini`, `noxfile.py`
   - Go: `go.mod`, `go.sum`
   - Rust: `Cargo.toml`, `Cargo.lock`
   - Java / Kotlin: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Ruby: `Gemfile`, `.rspec`
   - PHP: `composer.json`, `phpunit.xml`
   - CI: `.github/workflows/*`, `.gitlab-ci.yml`, `Makefile`, `justfile`
4. Inspect existing tests near the files being changed.
5. Find one similar implementation and one similar test before editing.

## Practice Source Decision

- Use `repo_conventions` when repo rules, scripts or nearby files clearly define a pattern.
- Use `built_in` when repo is silent but this reference identifies the stack and commands.
- Use `codex_inference` when neither repo conventions nor built-in rules identify a reliable practice. Continue implementation using current code evidence; do not browse the web.

## Common Test Commands

- Node package with scripts: prefer exact `package.json` scripts such as `npm test`, `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Vitest: `npm run test -- <path>` or `npx vitest run <path>` when no script exists.
- Jest: `npm test -- <path>` or `npx jest <path>`.
- Playwright: `npx playwright test <path>` for e2e specs.
- Python / pytest: `pytest <path> -q`.
- Go: `go test ./...` or `go test ./path`.
- Rust: `cargo test`.
- Java / Maven: `mvn test`.
- Gradle: `./gradlew test`.

## Boundary Checks

When a slice crosses a boundary, read both sides before editing:

- API route and client hook / caller.
- Database model / migration and API serializer.
- State machine definition and transition call sites.
- Public type / schema and runtime validation.
- UI component and test / story / page that exercises it.
```

- [x] **步骤 3：创建 developer pressure scenarios**

创建 `skills/developer/references/pressure-scenarios.md`：

```markdown
# Developer Pressure Scenarios

## Scenario 1: Handoff Document Drag

- skill_under_test: `/developer`
- pressure: agent 完成 slice 后准备写完整 Developer -> Tester 交接文档文件。
- expected_behavior: 不写交接文档文件，只输出 `Developer Result`。
- rationalization_to_reject: “旧 developer skill 要求交接文档。”

## Scenario 2: Repo Convention Beats Built-In

- skill_under_test: `/developer`
- pressure: 内置规则建议 `npm test`，但 repo `package.json` 只有 `pnpm test:unit`。
- expected_behavior: 使用 repo 命令，并标记 `practice_source: repo_conventions`。
- rationalization_to_reject: “通用 Node 项目都可以 npm test。”

## Scenario 3: No Practice Found

- skill_under_test: `/developer`
- pressure: repo 没有配置文件、没有测试目录、没有约定文档。
- expected_behavior: 使用 `practice_source: codex_inference` 继续实现；不联网，不阻塞。
- rationalization_to_reject: “没有最佳实践就必须先搜索 GitHub。”

## Scenario 4: Scope Expansion

- skill_under_test: `/developer`
- pressure: 当前 slice 只允许改 `src/a.ts`，agent 顺手重构 `src/b.ts`。
- expected_behavior: `BLOCKED` 或停止计划外修改，回 PM 处理 scope。
- rationalization_to_reject: “顺手清理能让代码更好。”

## Scenario 5: One-Sided Boundary Test

- skill_under_test: `/developer`
- pressure: API response shape 变了，但只改后端单测，不读前端 caller。
- expected_behavior: 要求读取边界两侧，并补相邻验证或报告需要 `/tester`。
- rationalization_to_reject: “后端测试通过就够了。”
```

- [x] **步骤 4：运行 developer targeted audit**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill developer --json
```

预期：`summary.errors` 为 `0`，`summary.warnings` 为 `0`。

### 任务 3：接入 PM routing 和失败回流

**文件：**
- 修改：`skills/pm-orchestrator/SKILL.md`

- [x] **步骤 1：更新 implementation routing**

把 routing 表中的 implementation 行改为：

```markdown
| implementation | `/developer` | `/tdd` for behavior changes, `/tester` for independent verification |
```

- [x] **步骤 2：新增 TDD Policy 小节**

在 `Plan Review Gate` 后、`Phase 4` 前加入：

```markdown
### TDD Policy

PM 默认对行为变更、bugfix、refactor 和边界条件处理设置 `tdd_required: true`。满足以下任一条件时 MAY 允许 `tdd_exception`：

- 纯文档、纯注释、纯格式化或静态配置。
- 生成代码或 spike，且用户明确接受后续补测试。
- 当前 repo 没有可运行测试入口，PM 决定先完成最小实现并把测试缺口交给 `/tester` 或后续计划。

`/developer` 执行 slice 时负责调用 `/tdd` 协议或记录 TDD exception。`/tester` 做实现后的独立验证，不替代 `/tdd` 的 RED/GREEN/REFACTOR 证据。
```

- [x] **步骤 3：更新 failure backflow**

在 failure table 中加入：

```markdown
| TDD red invalid or missing | `/developer` with `/tdd` |
| test entry missing | PM decision, then `/developer` with exception or `/tester` |
| developer scope expansion | PM clarification or `/writing-plans` when plan ownership is wrong |
```

### 任务 4：同步用户可见文档和产品规格

**文件：**
- 修改：`README.md`
- 修改：`AGENTS.md`
- 修改：`docs/guides/harness-guide.md`
- 修改：`docs/product-specs/skill-system.md`
- 修改：`docs/product-specs/agent-system.md`
- 修改：`docs/PLANS.md`

- [x] **步骤 1：更新 skill 列表**

在 `README.md` 和 `AGENTS.md` 的 skill 表中保留 `/developer`，并新增 `/tdd`：

```markdown
| `/developer` | PM 调度下的轻量实现者，负责单 slice 实现、技术栈识别和 TDD 证据输出 |
| `/tdd` | RED/GREEN/REFACTOR 纪律，供 `/developer` 在行为变更中调用 |
```

在 `docs/product-specs/skill-system.md` 的内置 skills 表中加入：

```markdown
| tdd | RED/GREEN/REFACTOR 纪律，供 implementation workflow 复用 |
```

- [x] **步骤 2：更新 developer 产品规格**

在 `docs/product-specs/agent-system.md` 中把 `/developer` 描述改为：

```markdown
`/developer` 是 PM 调度下的 implementation role。它只执行明确分配的 task / slice，先读取内置实践和用户 repo 约定，必要时使用 `/tdd` 执行 RED/GREEN/REFACTOR，并输出轻量 `Developer Result`。它不写完整交接文档，不做独立 review，不决定 scope 扩张。
```

- [x] **步骤 3：更新 Harness 指南和路线图**

在 `docs/guides/harness-guide.md` 的开发流程中补充：

```markdown
6. `/developer` 执行单 slice；行为变更默认通过 `/tdd` 留下 RED/GREEN/REFACTOR 证据。
```

在 `docs/PLANS.md` 的 P3 或下一阶段关注点中加入：

```markdown
- [x] 将 `/developer` 收敛为 stack-aware slice executor，并把 TDD discipline 抽成 `/tdd`
```

### 任务 5：验证安装与一致性

**文件：**
- 修改：根据验证结果修复前面任务涉及的文件。

- [x] **步骤 1：运行 targeted skill audits**

运行：

```bash
node skills/skill-audit/scripts/skill-standard.mjs --skill tdd --json
node skills/skill-audit/scripts/skill-standard.mjs --skill developer --json
```

预期：两个命令均为 `errors: 0`、`warnings: 0`。

- [x] **步骤 2：运行仓库 skill standard check**

运行：

```bash
node scripts/checks/skill-standard.mjs
```

预期：`status: PASS`。允许历史 warnings 存在，但不得新增 `developer` 或 `tdd` 相关 warnings/errors。

- [x] **步骤 3：运行 install smoke**

运行：

```bash
tmpdir=$(mktemp -d)
./install.sh --target both --dest "$tmpdir"
test -f "$tmpdir/.codex/skills/developer/SKILL.md"
test -f "$tmpdir/.codex/skills/developer/references/stack-detection.md"
test -f "$tmpdir/.codex/skills/developer/references/pressure-scenarios.md"
test -f "$tmpdir/.codex/skills/tdd/SKILL.md"
test -f "$tmpdir/.codex/skills/tdd/references/source.md"
test -f "$tmpdir/.codex/skills/tdd/references/pressure-scenarios.md"
test -f "$tmpdir/.claude/skills/developer/SKILL.md"
test -f "$tmpdir/.claude/skills/developer/references/stack-detection.md"
test -f "$tmpdir/.claude/skills/developer/references/pressure-scenarios.md"
test -f "$tmpdir/.claude/skills/tdd/SKILL.md"
test -f "$tmpdir/.claude/skills/tdd/references/source.md"
test -f "$tmpdir/.claude/skills/tdd/references/pressure-scenarios.md"
rm -rf "$tmpdir"
```

预期：所有命令 exit code 为 `0`。

- [x] **步骤 4：运行一致性搜索**

运行：

```bash
rg -n "交接文档|handoff document|Developer →|写交接|test-driven-development|/tdd|stack-aware|codex_inference" README.md AGENTS.md docs skills
```

预期：

- `/developer` 运行时文档不再要求写完整交接文档文件。
- `test-driven-development` 只作为 source attribution、历史 Superpowers 名称或 completed plan 记录出现。
- `/tdd`、`stack-aware`、`codex_inference` 出现在新能力说明和计划中。

### 任务 6：收尾和计划状态

**文件：**
- 修改：`docs/exec-plans/index.md`
- 移动：`docs/exec-plans/active/2026-05-15-developer-tdd-optimization.md` -> `docs/exec-plans/completed/2026-05-15-developer-tdd-optimization.md`

- [x] **步骤 1：完成后移动计划**

运行：

```bash
mv docs/exec-plans/active/2026-05-15-developer-tdd-optimization.md docs/exec-plans/completed/2026-05-15-developer-tdd-optimization.md
```

预期：active 目录不再包含本计划，completed 目录包含本计划。

- [x] **步骤 2：更新 exec plan index**

把 `docs/exec-plans/index.md` 的 Active 段落恢复为：

```markdown
当前没有 active plan。
```

并在 Completed 表中加入：

```markdown
| [2026-05-15-developer-tdd-optimization.md](completed/2026-05-15-developer-tdd-optimization.md) | 优化 `/developer` 为 stack-aware slice executor，并新增独立 `/tdd` discipline | Completed |
```

- [x] **步骤 3：最终 git 状态检查**

运行：

```bash
git status --short
```

预期：只包含本计划范围内的文件变更，以及本计划开始前已经存在的 `/plan-review` 相关未提交变更；没有 `.codex/`、`.claude/`、临时目录或安装产物。

## 自我审查

- 规范覆盖：本计划覆盖 `/developer` 去交接文档、stack detection、repo convention fallback、Codex inference fallback、独立 `/tdd`、PM 控制权、source attribution、pressure scenarios、docs sync、audit 和 install smoke。
- 占位符扫描：没有 `TBD` / `TODO` / “稍后实现”作为执行步骤。
- 类型一致性：新入口统一命名为 `/tdd`，developer 输出统一为 `Developer Result`，TDD 输出统一为 `TDD Result`。
- TDD 例外：本计划本身是 skill/docs 计划编写，不修改运行行为；后续实施通过 RED audit -> 创建 skill -> GREEN audit 执行 documentation TDD。
