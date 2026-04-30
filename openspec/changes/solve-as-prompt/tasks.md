## 1. Create Solve Prompt

- [x] 1.1 Create `.github/prompts/solve.prompt.md` with front-matter `description:` only (matching the pattern of `opsx-apply.prompt.md`, `opsx-propose.prompt.md`). Body contains the full 6-step autonomous pipeline: (1) read and analyse task file, determine change type (new-tool/modification/other), derive kebab-case change name; (2) codebase exploration via `explore` sub-agent reading `src/markdown.ts` + `src/index.ts`, then write `plan.md` to session folder + insert atomic tasks into SQL `todos` table as `pending` — no `openspec` CLI commands; (3) implement each SQL todo in order updating status `pending→in_progress→done`, following conventions from `.github/copilot-instructions.md`; (4) rubber-duck code review of changed files; (5) quality gate `pnpm run lint → typecheck → build → test`, retry up to 2 cycles on failure; (6) completion report. Must never ask operator for input — document assumptions instead.

## 2. Remove Old Skill File

- [x] 2.1 Delete `.github/skills/solve/SKILL.md` and the `.github/skills/solve/` directory to eliminate the duplicate entry point

## 3. Verification

- [x] 3.1 Verify `.github/prompts/solve.prompt.md` exists and front-matter contains only `description:`
- [x] 3.2 Verify the prompt body contains no `openspec` CLI commands
- [x] 3.3 Verify `.github/skills/solve/SKILL.md` no longer exists
- [x] 3.4 Confirm no changes to `src/`, `tests/`, `.github/copilot-instructions.md`, or instruction files
