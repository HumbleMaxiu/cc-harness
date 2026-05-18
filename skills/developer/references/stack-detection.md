# Developer Stack Detection

## Detection Order

1. Read PM-provided `files_allowed`, `plan_path`, `task_id` and `step_scope`.
2. Use this built-in checklist as the first practice source.
3. Then read repo-level rules: `AGENTS.md`, `docs/conventions/`, `docs/memory/feedback/prevents-recurrence.md`.
4. Inspect package and tool files:
   - JavaScript / TypeScript: `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`, `vite.config.*`, `next.config.*`, `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*`
   - Python: `pyproject.toml`, `requirements*.txt`, `pytest.ini`, `tox.ini`, `noxfile.py`
   - Go: `go.mod`, `go.sum`
   - Rust: `Cargo.toml`, `Cargo.lock`
   - Java / Kotlin: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Ruby: `Gemfile`, `.rspec`
   - PHP: `composer.json`, `phpunit.xml`
   - CI: `.github/workflows/*`, `.gitlab-ci.yml`, `Makefile`, `justfile`
5. Inspect existing tests near the files being changed.
6. Find one similar implementation and one similar test before editing.

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
