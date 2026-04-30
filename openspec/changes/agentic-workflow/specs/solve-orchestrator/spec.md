## ADDED Requirements

### Requirement: Solve skill entry point
The system SHALL provide a GitHub Copilot CLI skill named `solve` that accepts a task file path as input and drives the full autonomous implementation pipeline without operator assistance after invocation.

#### Scenario: Invoked with a task file
- **WHEN** the operator runs `/solve @task.md`
- **THEN** the agent reads task.md, executes the full pipeline, and produces a complete implementation — all without further operator input

#### Scenario: Task file is missing or unreadable
- **WHEN** the task file path does not exist or cannot be read
- **THEN** the agent reports the error clearly and stops without making any code changes

---

### Requirement: Task analysis phase
The solve skill SHALL analyze the task file to determine change type and derive a kebab-case change name before entering the spec-driven pipeline.

#### Scenario: New tool task
- **WHEN** the task describes adding a new MCP tool
- **THEN** the agent identifies change type as "new-tool", derives a name from the tool name (e.g. `find-links`), and uses the "Adding a new tool" pattern from context

#### Scenario: Modification task
- **WHEN** the task describes changing behavior of an existing tool or module
- **THEN** the agent identifies change type as "modification" and uses the "Modifying an existing tool" pattern from context

#### Scenario: Other change type
- **WHEN** the task does not match known patterns
- **THEN** the agent proceeds with the OpenSpec pipeline using reasonable assumptions and documents them in the proposal

---

### Requirement: Spec-driven planning pipeline
The solve skill SHALL run the full OpenSpec pipeline (propose → design → specs → tasks) before writing any product code.

#### Scenario: Full pipeline execution
- **WHEN** task analysis is complete
- **THEN** the agent creates an OpenSpec change with `openspec new change "<name>"` and generates all artifacts in dependency order before implementing

#### Scenario: Artifacts build on each other
- **WHEN** creating specs and design
- **THEN** the agent reads the proposal artifact before writing design, and reads proposal + design before writing tasks

---

### Requirement: Implementation follows tasks artifact
The solve skill SHALL implement each task from `tasks.md` sequentially, marking tasks complete as it goes, and commit no code until the tasks artifact exists.

#### Scenario: Implementation follows spec
- **WHEN** tasks.md is complete
- **THEN** the agent implements each task in order, touching only `src/markdown.ts`, `src/index.ts`, and `tests/markdown.test.ts` (plus any new files needed by the task)

#### Scenario: No premature code changes
- **WHEN** the pipeline has not yet produced tasks.md
- **THEN** the agent makes no edits to `src/` or `tests/`

---

### Requirement: Code review before quality gate
The solve skill SHALL invoke an independent code review (rubber-duck agent) after implementation and before running the quality gate.

#### Scenario: Review runs after implementation
- **WHEN** all tasks are marked complete
- **THEN** the agent invokes a rubber-duck review of the changed files and addresses any critical findings before proceeding

#### Scenario: Review finds blocking issues
- **WHEN** the rubber-duck identifies a bug or logic error
- **THEN** the agent fixes the issue and re-invokes the review

---

### Requirement: Quality gate passes before completion
The solve skill SHALL run the full quality gate in order and only declare success when all steps pass.

#### Scenario: Quality gate succeeds
- **WHEN** code review is complete
- **THEN** the agent runs `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`, `pnpm run test` in order and all pass

#### Scenario: Quality gate fails
- **WHEN** a quality gate step fails
- **THEN** the agent diagnoses the failure, fixes the code, and reruns the quality gate (up to 2 retry cycles)

#### Scenario: Regression detected
- **WHEN** `pnpm run test` fails on tests that existed before the change
- **THEN** the agent treats this as a blocking failure and does not declare success until all pre-existing tests pass

---

### Requirement: Agent autonomy — no operator questions
The solve skill SHALL complete the entire pipeline without asking the operator any questions.

#### Scenario: Ambiguous task detail
- **WHEN** the task description is ambiguous about an implementation detail
- **THEN** the agent makes a reasonable decision, documents the assumption in the proposal, and continues

#### Scenario: Unexpected error during pipeline
- **WHEN** an unexpected error occurs (e.g., build failure, missing dependency)
- **THEN** the agent attempts to diagnose and fix the issue autonomously, retrying up to 2 times before reporting a final error summary

---

### Requirement: Global agent instructions
The system SHALL provide `.github/copilot-instructions.md` with project conventions, quality gate procedure, and autonomy rules so the agent has consistent guidance on every run.

#### Scenario: Agent reads instructions automatically
- **WHEN** GitHub Copilot CLI starts in this repository
- **THEN** `.github/copilot-instructions.md` is loaded automatically and the agent follows its conventions without being told explicitly

#### Scenario: Instructions cover all critical patterns
- **WHEN** the agent needs to add a new tool, modify existing code, or run the quality gate
- **THEN** the instructions provide the exact steps and conventions to follow (file locations, import style, Zod schema patterns, test structure)
