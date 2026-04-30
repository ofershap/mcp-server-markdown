## ADDED Requirements

### Requirement: Solve prompt file exists at correct path
The system SHALL provide a prompt file at `.github/prompts/solve.prompt.md` so that GitHub Copilot CLI resolves `/solve @task.md` to it automatically.

#### Scenario: Correct file location
- **WHEN** the operator runs `/solve @task.md` in GitHub Copilot CLI
- **THEN** Copilot CLI loads `.github/prompts/solve.prompt.md` and executes it with `task.md` as the input reference

#### Scenario: Prompt front-matter is minimal
- **WHEN** the file is read
- **THEN** its YAML front-matter contains only a `description:` field (matching the pattern of all other prompt files in `.github/prompts/`)

---

### Requirement: Solve prompt contains the complete autonomous pipeline
The prompt file SHALL embed all pipeline steps inline so the agent can execute them without loading any external skill file.

#### Scenario: No skill delegation
- **WHEN** `/solve @task.md` is executed
- **THEN** the agent follows the steps in the prompt body directly — it MUST NOT require `.github/skills/solve/SKILL.md` to exist

#### Scenario: Pipeline steps are present
- **WHEN** the prompt is loaded
- **THEN** it contains all of: task analysis, codebase exploration, planning (SQL todos + plan.md), implementation, rubber-duck review, quality gate, completion report

---

### Requirement: Solve prompt uses no openspec CLI commands
The prompt file MUST NOT invoke the `openspec` executable. All planning MUST use GitHub Copilot CLI native primitives.

#### Scenario: Native planning only
- **WHEN** the agent reaches the planning step
- **THEN** it spawns an `explore` sub-agent for codebase analysis, writes `plan.md` to the session folder, and inserts tasks into the SQL `todos` table — with no `openspec new change`, `openspec status`, or `openspec instructions` commands

---

### Requirement: Old skill file is removed
The file `.github/skills/solve/SKILL.md` SHALL be deleted to prevent duplicate entry point conflicts.

#### Scenario: No duplicate entry point
- **WHEN** the repo is in its final state
- **THEN** `.github/skills/solve/SKILL.md` does not exist
