## Why

The current `/solve` entry point is a prompt file (`.github/prompts/solve.prompt.md`), but every other slash command in this repo — `/openspec-propose`, `/openspec-apply-change`, `/openspec-explore`, `/openspec-archive-change` — is implemented as a skill (`.github/skills/<name>/SKILL.md`). Skills are invoked via the `skill` tool and support richer metadata (name, description, license, compatibility) than prompts. Switching `/solve` to the same format makes it consistent with the rest of the CLI workflow and proves the skill mechanism is sufficient for the hackathon `/solve @task.md` requirement.

## What Changes

- Delete `.github/prompts/solve.prompt.md`
- Create `.github/skills/solve/SKILL.md` with the same 6-step autonomous pipeline (read task → explore → plan → implement → rubber-duck → quality gate)
- Skill front-matter uses `name:`, `description:`, `license:`, `compatibility:`, and `metadata:` fields consistent with other skills in the repo
- No changes to `src/`, `tests/`, or any other files

## Capabilities

### New Capabilities

- `solve-skill`: The `/solve` slash command implemented as a skill instead of a prompt, preserving the full autonomous pipeline but using the skill invocation mechanism

### Modified Capabilities

_(none — no existing specs change)_

## Impact

- `.github/prompts/solve.prompt.md` removed
- `.github/skills/solve/SKILL.md` created
- Slash command `/solve @task.md` continues to work identically from the user's perspective
