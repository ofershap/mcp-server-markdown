## Context

GitHub Copilot CLI resolves slash commands from two locations:
- **Prompts**: `.github/prompts/<name>.prompt.md` → invoked as `/<name> [args]`
- **Skills**: `.github/skills/<name>/SKILL.md` → invoked as `/<name> [args]`

Both support `@file` references as arguments. The existing repo uses prompts for OpenSpec slash commands (`/opsx:apply`, `/opsx:propose`, etc.) and uses skills for the named sub-workflows those prompts delegate to.

The hackathon specifies `/solve @task.md` as the exact entry point. A prompt file at `.github/prompts/solve.prompt.md` is the canonical mechanism and directly mirrors the pattern already used in this repo.

The `solve` skill (`.github/skills/solve/SKILL.md`) was implemented first but is now superseded. Its content — the full 6-step pipeline — moves verbatim into the prompt body, with Step 2 also updated to remove the `openspec` CLI dependency (as already specified in the `copilot-cli-native-workflow` change).

## Goals / Non-Goals

**Goals:**
- Create `.github/prompts/solve.prompt.md` with the correct prompt front-matter format (`description:` only)
- Embed the complete pipeline: read task → explore codebase → plan (SQL todos + plan.md) → implement → rubber-duck review → quality gate → report
- Delete `.github/skills/solve/SKILL.md` to avoid duplicate/conflicting entry points
- No `openspec` CLI dependency in the prompt

**Non-Goals:**
- Changing the pipeline logic itself (that is covered by `copilot-cli-native-workflow`)
- Modifying `.github/copilot-instructions.md` or instruction files
- Touching product code (`src/`, `tests/`)

## Decisions

### Decision: Prompt format over skill format
**Choice:** `.github/prompts/solve.prompt.md` with minimal front-matter (`description:` only).

**Rationale:** This is the exact pattern the repo already uses for all slash command entry points (`opsx-apply.prompt.md`, `opsx-propose.prompt.md`, etc.). It maps 1:1 to the `/solve @task.md` invocation syntax. Skills are for sub-workflows that prompts delegate to — not for top-level slash commands.

### Decision: Delete the skill file
**Choice:** Remove `.github/skills/solve/SKILL.md` after the prompt is created.

**Rationale:** Two files defining the same `/solve` entry point creates ambiguity about which one Copilot CLI picks up. Removing the skill eliminates the conflict and keeps the repo clean.

## Risks / Trade-offs

- **Risk: Content divergence** — The prompt and the (now-deleted) skill could have diverged before deletion. → Mitigation: use the skill content as the base for the prompt, incorporating the `copilot-cli-native-workflow` planning changes at the same time.
- **Trade-off: Two open changes** — `copilot-cli-native-workflow` and `solve-as-prompt` both touch `solve`. → Resolution: implement `solve-as-prompt` last, incorporating the native-workflow changes into the prompt body directly. This supersedes `copilot-cli-native-workflow`.

## Open Questions

_(none)_
