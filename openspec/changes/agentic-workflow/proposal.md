## Why

The repository has no automated workflow for implementing tasks end-to-end. When a task (e.g., "add a new MCP tool") is delivered as a `task.md` file, an agent must be able to read it, plan the implementation, write code, test it, review it, and verify it — all without any operator assistance after the initial `/solve @task.md` command.

## What Changes

- **New**: `solve` skill — the orchestrator entrypoint invoked via `/solve @task.md`. Reads the task, drives the full pipeline, and produces a working implementation.
- **New**: `solve-task` sub-skill — parses the task file, identifies the type of change (new tool, modification, other), and decides the implementation strategy.
- **New**: `.github/copilot-instructions.md` — global agent instructions: project conventions, quality gate, tool patterns, autonomy requirements.
- **New**: `.github/instructions/` path-specific instructions — scoped guidelines for `src/`, `tests/`, and `openspec/` directories.
- **Enhanced**: `openspec/config.yaml` — complete project context, coding conventions, and per-artifact rules already in place (done as prep work).

## Capabilities

### New Capabilities

- `solve-orchestrator`: The `/solve` entrypoint skill. Accepts a task file, determines change type, drives the OpenSpec spec-driven pipeline (propose → design → specs → tasks → implement → code-review → quality-gate), and commits the result. Fully autonomous — no operator input after invocation.

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- New files: `.github/skills/solve/SKILL.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`
- No changes to `src/`, `tests/`, or any existing product code
- The workflow wraps the existing OpenSpec skills (`openspec-propose`, `openspec-apply-change`, `openspec-explore`) and the existing `markdown-search` skill
