## Context

The repo has two mechanisms for slash commands in GitHub Copilot CLI:

1. **Prompts** — `.github/prompts/<name>.prompt.md`. The agent loads the file contents directly as instructions. Slash command: `/<name>`.
2. **Skills** — `.github/skills/<name>/SKILL.md`. The Copilot CLI runtime generates "Use the skill tool to invoke the '<name>' skill", and the agent calls `skill("<name>")` which loads the SKILL.md as `<skill-context>`. Slash command: `/<name>`.

Currently `/solve` is implemented as a prompt. All other slash commands in this repo (`/openspec-propose`, `/openspec-apply-change`, `/openspec-explore`, `/openspec-archive-change`) are skills. Both mechanisms produce identical user-facing slash command invocations.

## Goals / Non-Goals

**Goals:**

- Convert `/solve` from a prompt to a skill with no behavior change
- Align format with every other slash command in the repo
- Verify `/solve @task.md` remains a valid invocation after the change

**Non-Goals:**

- Changing the pipeline logic (same 6 steps)
- Changing sub-agent models (explore: claude-sonnet-4.6, rubber-duck: gpt-5.4)
- Any changes to `src/`, `tests/`, or the quality gate

## Decisions

**Use skill front-matter over prompt front-matter**

Skills use: `name:`, `description:`, `license:`, `compatibility:`, `metadata:` (author, version, generatedBy).
Prompts use: `description:` only.

The skill format is chosen because it is consistent with all other slash commands in the repo and provides richer metadata for discoverability.

**Preserve pipeline content verbatim**

The 6-step pipeline body from `solve.prompt.md` is copied into `SKILL.md` unchanged. No logic changes.

**Delete the prompt file**

Keeping both would create two conflicting slash command definitions for `/solve`. The prompt file is deleted; the skill becomes the sole entry point.

## Risks / Trade-offs

- **Risk**: Prompt and skill loading mechanisms differ slightly — prompt content is inline; skill content is loaded via `<skill-context>` tag. → **Mitigation**: The pipeline instructions are self-contained and don't rely on how they're loaded; both mechanisms produce the same agent behaviour.
- **Risk**: If the Copilot CLI runtime changes skill discovery, `/solve` could stop working. → **Mitigation**: No higher than the risk that exists for `/openspec-propose` and the other skills today.
