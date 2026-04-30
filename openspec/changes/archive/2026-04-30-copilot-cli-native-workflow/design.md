## Context

The `solve` skill currently orchestrates the planning phase using the `openspec` CLI executable: `openspec new change`, `openspec status --json`, `openspec instructions <artifact> --json`. This assumes `openspec` is available at runtime on the evaluator's machine — an assumption that may not hold.

GitHub Copilot CLI has all the primitives needed for structured, spec-driven planning without any external CLI tool: a session-scoped SQL database for task tracking, a `plan.md` session file for structured reasoning, and specialized sub-agents (explore, rubber-duck, general-purpose) that can be composed into a pipeline.

The existing `.github/copilot-instructions.md` and `.github/instructions/` files already provide the agent with project conventions. The planning mechanism is the only thing that needs to change.

## Goals / Non-Goals

**Goals:**

- Eliminate the runtime dependency on the `openspec` executable from the `solve` skill
- Preserve the same pipeline structure: analyse → plan → implement → review → quality gate
- Use only GitHub Copilot CLI-native primitives: SQL todos, plan.md, sub-agents
- Remain compliant with hackathon rules (only Copilot CLI features, no manual operator steps)

**Non-Goals:**

- Changing what the `solve` skill produces (still: working code + tests + passing quality gate)
- Modifying `.github/copilot-instructions.md` or the instruction files
- Replacing the rubber-duck review step (already Copilot CLI-native)
- Adding new agent instructions or capabilities

## Decisions

### Decision 1: Use SQL `todos` table for task tracking instead of `tasks.md` checkboxes

**Choice:** Write implementation tasks into the session SQL `todos` table, update status as work proceeds (`pending` → `in_progress` → `done`).

**Rationale:** The SQL `todos` table is a first-class Copilot CLI primitive designed for exactly this — tracking work items within a session. It doesn't require any external tool and survives context switches. The `tasks.md` checkbox format was an OpenSpec artifact format; without OpenSpec parsing it, plain SQL is simpler and more reliable.

**Alternative considered:** Keep `tasks.md` but without OpenSpec tracking. Rejected — the file format provides no benefit without the CLI parsing it, and inline task state is harder to query atomically.

### Decision 2: Use `plan.md` in the session folder for structured thinking

**Choice:** Before implementation, write a `plan.md` to the session state folder (`~/.copilot/session-state/<session-id>/plan.md`) with the proposal, design decisions, and implementation approach.

**Rationale:** This directly maps to the spec-driven workflow bonus category: "наличие спецификации, плана и связи между ними" (existence of specification, plan, and connection between them). It gives the agent a stable reference document throughout the session without depending on OpenSpec file paths.

### Decision 3: Use `explore` sub-agent for codebase analysis phase

**Choice:** Before planning, spawn an `explore` sub-agent to read `src/markdown.ts` and `src/index.ts` and return a summary of the current tool patterns and relevant code.

**Rationale:** The explore agent runs in a separate context and returns a clean summary. This keeps the main agent's context uncluttered and mirrors the "openspec explore" step that was previously available.

## Risks / Trade-offs

- **Risk: SQL todos don't survive between separate `/solve` invocations** — Each `/solve` is a fresh session; the SQL table starts empty. → Not an issue: tasks are created fresh from the plan on each run.
- **Risk: Plan.md is session-scoped, not committed** — The plan is ephemeral. → Acceptable: the plan exists for agent guidance within one session, not for permanent documentation.
- **Trade-off: Less rigid artifact structure than OpenSpec** — OpenSpec enforced proposal/spec/design/tasks separation. The native approach is more fluid. → Mitigated by the explicit instructions in the `solve` skill to still reason through each phase before writing code.

## Migration Plan

1. Rewrite `.github/skills/solve/SKILL.md` — Step 2 replaces all `openspec` commands with SQL inserts and plan.md writing; all other steps remain structurally the same.
2. No other files change.
3. Rollback: restore previous `SKILL.md` content from git history.

## Open Questions

_(none)_
