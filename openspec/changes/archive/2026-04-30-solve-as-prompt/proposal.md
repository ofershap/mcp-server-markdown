## Why

The hackathon evaluation entry point is `/solve @task.md` — a GitHub Copilot CLI slash command invocation. Slash commands in Copilot CLI map to **prompt files** at `.github/prompts/<name>.prompt.md`, not to skills. The current implementation uses a skill at `.github/skills/solve/SKILL.md`, which is a different invocation mechanism. To ensure `/solve @task.md` works correctly as specified in the rules, the orchestrator must live as a prompt file.

## What Changes

- **New**: `.github/prompts/solve.prompt.md` — the `/solve` entry point as a proper Copilot CLI prompt file. Contains the full autonomous pipeline: read task → plan → implement → code review → quality gate.
- **Removed**: `.github/skills/solve/SKILL.md` — the skill-based implementation is superseded by the prompt.

## Capabilities

### New Capabilities

- `solve-prompt`: A `.github/prompts/solve.prompt.md` file that is invoked as `/solve @task.md`. Contains the complete autonomous implementation pipeline using only GitHub Copilot CLI native primitives (sub-agents, SQL todos, plan.md, quality gate commands). No dependency on the `openspec` CLI executable.

### Modified Capabilities

_(none)_

## Impact

- New file: `.github/prompts/solve.prompt.md`
- Deleted file: `.github/skills/solve/SKILL.md`
- No changes to `src/`, `tests/`, or any instruction files
