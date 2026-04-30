## 1. Create Solve Skill

- [x] 1.1 Create `.github/skills/solve/SKILL.md` with skill front-matter (`name: solve`, `description:`, `license: MIT`, `compatibility:`, `metadata:` matching the style of other skills). Copy the full 6-step pipeline body from `.github/prompts/solve.prompt.md` verbatim, preserving sub-agent model pins (`explore: claude-sonnet-4.6`, `rubber-duck: gpt-5.4`).

## 2. Remove Prompt File

- [x] 2.1 Delete `.github/prompts/solve.prompt.md` to eliminate the duplicate entry point.

## 3. Verification

- [x] 3.1 Verify `.github/skills/solve/SKILL.md` exists and front-matter contains `name:`, `description:`, `license:`, `compatibility:`, and `metadata:` fields.
- [x] 3.2 Verify `.github/prompts/solve.prompt.md` no longer exists.
- [x] 3.3 Verify the skill body contains no `openspec` CLI command invocations.
- [x] 3.4 Verify the skill body contains `model: "claude-sonnet-4.6"` and `model: "gpt-5.4"` for the sub-agent calls.
