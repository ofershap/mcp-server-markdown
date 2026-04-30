## Why

The current `solve` skill depends on the `openspec` CLI executable at runtime (`openspec new change`, `openspec instructions`, `openspec status`). This creates an external runtime dependency that may not be available in the evaluation environment. The hackathon requires using **GitHub Copilot CLI** with its native sub-agent capabilities — skills, task agents, rubber-duck, and structured planning — not third-party CLI tools.

## What Changes

- **BREAKING — Modified**: `solve-orchestrator` — replace all `openspec` CLI calls with GitHub Copilot CLI-native planning. The skill now uses agent-internal structured planning (plan.md + SQL todos), sub-agents for exploration and code review, and the existing instruction files for guidance. The overall pipeline structure (analyse → plan → implement → review → quality gate) stays the same; only the mechanism changes.
- **Removed**: Runtime dependency on the `openspec` executable from the `solve` pipeline
- **Preserved**: All agent instructions files (`.github/copilot-instructions.md`, `.github/instructions/`) remain unchanged — they are the context, not the mechanism

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `solve-orchestrator`: The planning pipeline changes from OpenSpec CLI commands to Copilot CLI-native structured planning. The skill now writes a `plan.md` to the session folder, tracks tasks in the SQL `todos` table, and uses sub-agents (explore for codebase analysis, rubber-duck for code review) — all GitHub Copilot CLI primitives with no external CLI dependency.

## Impact

- Modified file: `.github/skills/solve/SKILL.md`
- No changes to `src/`, `tests/`, or any other existing files
- Eliminates runtime dependency on the `openspec` executable
