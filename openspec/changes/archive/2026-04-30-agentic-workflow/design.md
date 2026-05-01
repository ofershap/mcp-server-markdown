## Context

The mcp-server-markdown repository has no mechanism for autonomously implementing tasks delivered as markdown files. Evaluation requires running `/solve @task.md` and having the agent produce a working implementation end-to-end with zero operator intervention. Tasks may involve adding new MCP tools, modifying existing ones, or other types of changes.

The existing infrastructure provides solid building blocks: OpenSpec skills for spec-driven development, a `markdown-search` skill for reading docs, and a quality gate via npm scripts. What's missing is the orchestrating entry point that ties them together into a reliable, autonomous pipeline.

## Goals / Non-Goals

**Goals:**

- Provide a `/solve` skill that accepts any `task.md` and produces a complete, tested, reviewed implementation
- Work autonomously — no operator input after `/solve @task.md`
- Handle the full pipeline: understand → plan (OpenSpec) → implement → test → code-review → quality gate
- Be robust to diverse task types (new tool, modification, refactor, other)
- Guide the agent to follow existing project conventions exactly
- Minimize −30% penalty risk by ensuring the agent never asks the operator for help

**Non-Goals:**

- Handling non-TypeScript or non-MCP changes
- Auto-publishing to npm
- Multi-task batch execution
- Changing the product source code as part of the workflow setup itself

## Decisions

### Decision 1: Single orchestrator skill (`solve`) using sub-skills

**Choice:** One top-level `solve` SKILL.md that calls existing sub-skills (openspec-propose, openspec-apply-change, rubber-duck code review, quality gate) rather than a monolithic prompt.

**Rationale:** Composing existing skills keeps each step focused and reusable. The orchestrator defines the sequence and decision logic; the individual skills own their domain. This is also consistent with the hackathon's intent: "build a pipeline using skills, sub-agents, and workflow — not solve everything in one request."

**Alternative considered:** One giant prompt with all instructions inline. Rejected because it is harder to maintain, more likely to drift off-track on long contexts, and doesn't leverage the existing OpenSpec workflow.

### Decision 2: OpenSpec spec-driven pipeline for all task types

**Choice:** Always run the full OpenSpec pipeline (propose → design → specs → tasks → apply) regardless of task size.

**Rationale:** The hackathon explicitly scores "Spec-driven workflow" as a bonus. More importantly, the structured pipeline helps the agent reason about WHAT to build before HOW, reducing implementation errors. The pipeline is fast enough (a few tool calls each step) that the overhead is worthwhile.

**Alternative considered:** Skip spec for trivial changes. Rejected because the "hidden task" may be non-trivial and we can't know in advance.

### Decision 3: Mandatory code review step (rubber-duck agent)

**Choice:** After implementation, always invoke the `rubber-duck` agent for a code review before running the quality gate.

**Rationale:** Hackathon scores "Independent code review" as a bonus category. The rubber-duck agent catches logic errors before they become test failures. Cost is low (one agent call).

### Decision 4: Quality gate runs in exact CI order

**Choice:** Run `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`, `pnpm run test` in that order and fail fast.

**Rationale:** This mirrors the CI pipeline in `.github/workflows/ci.yml`. Catching type errors before build saves time. Tests after build ensures we test the compiled output path.

### Decision 5: Agent instructions via `.github/copilot-instructions.md` + path-specific `.github/instructions/`

**Choice:** Global agent instructions in `.github/copilot-instructions.md`; scoped instructions for `src/` and `tests/` in `.github/instructions/`.

**Rationale:** GitHub Copilot CLI picks up these files automatically. Scoped instructions avoid cognitive overload — the agent sees only relevant guidance for the file it's editing.

## Risks / Trade-offs

- **Risk: Task ambiguity** — task.md might be underspecified. → Mitigation: The `solve` skill instructs the agent to make reasonable assumptions and document them rather than ask the operator.
- **Risk: Quality gate failure after implementation** — lint/type errors may appear. → Mitigation: The skill instructs the agent to fix failures and retry up to 2 times before escalating.
- **Risk: Hidden task is a different change type** — e.g., modifying existing logic instead of adding a new tool. → Mitigation: The `solve` skill explicitly covers multiple change patterns from `openspec/config.yaml`; design.md and spec.md instructions guide the agent to adapt.
- **Risk: OpenSpec rules warnings** — `config.yaml` rules format causes warnings (not errors). → Mitigation: Known issue with the CLI version; rules are not applied but context is. Fix artifact keys if time permits.

## Open Questions

_(none — all blocking decisions are resolved above)_
