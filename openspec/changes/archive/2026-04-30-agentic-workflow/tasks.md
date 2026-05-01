## 1. Global Agent Instructions

- [x] 1.1 Create `.github/copilot-instructions.md` with: project overview, repo structure, code style conventions (imports, Zod, return format, path.resolve), quality gate order (`pnpm run lint` → `pnpm run typecheck` → `pnpm run build` → `pnpm run test`), all three change patterns (new tool / modify existing / other), autonomy rule (no operator questions — make assumptions and document them), and security guidance (validate paths, handle errors gracefully)
- [x] 1.2 Create `.github/instructions/src.instructions.md` scoped to `src/**` with: tool registration pattern, Zod schema conventions, noUncheckedIndexedAccess guidance, ESM import style
- [x] 1.3 Create `.github/instructions/tests.instructions.md` scoped to `tests/**` with: vitest test structure, temp directory pattern, test coverage expectations (happy path, edge cases, error cases)

## 2. Solve Orchestrator Skill

- [x] 2.1 Create `.github/skills/solve/SKILL.md` — the `/solve` entrypoint skill that: reads the task file, derives a change name, runs the OpenSpec pipeline (new change → propose → design → specs → tasks), implements all tasks, invokes rubber-duck code review, runs the quality gate, and retries up to 2 times on failure. Must never ask the operator for input; must document assumptions in the proposal instead.

## 3. Verification

- [x] 3.1 Verify that `.github/copilot-instructions.md` exists and covers all required sections
- [x] 3.2 Verify that `.github/skills/solve/SKILL.md` exists and the skill structure is valid (has YAML front-matter with `name` and `description`)
- [x] 3.3 Confirm no changes were made to `src/`, `tests/`, or any existing product files
