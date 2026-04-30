## ADDED Requirements

### Requirement: Solve skill invocation

The `/solve` slash command SHALL be implemented as a skill at `.github/skills/solve/SKILL.md` using the standard Copilot CLI skill front-matter (`name`, `description`, `license`, `compatibility`, `metadata`).

#### Scenario: Slash command works via skill mechanism

- **WHEN** user invokes `/solve @task.md` in GitHub Copilot CLI
- **THEN** the runtime loads `.github/skills/solve/SKILL.md` via the skill tool and the agent follows its pipeline

#### Scenario: Skill front-matter is valid

- **WHEN** `.github/skills/solve/SKILL.md` is read
- **THEN** it contains `name:`, `description:`, `license:`, `compatibility:`, and `metadata:` fields consistent with other skills in `.github/skills/`

### Requirement: Prompt file removed

The file `.github/prompts/solve.prompt.md` SHALL NOT exist after this change is applied.

#### Scenario: No duplicate solve entry points

- **WHEN** the `.github/prompts/` directory is listed
- **THEN** `solve.prompt.md` is absent

### Requirement: Pipeline preserved

The 6-step autonomous pipeline (read task → explore → plan → implement → rubber-duck → quality gate) SHALL be preserved verbatim in `SKILL.md` with no behaviour changes.

#### Scenario: Sub-agent models are specified

- **WHEN** the skill body is read
- **THEN** the explore sub-agent is invoked with `model: "claude-sonnet-4.6"` and the rubber-duck sub-agent with `model: "gpt-5.4"`

#### Scenario: No openspec CLI commands

- **WHEN** the skill body is searched for `openspec`
- **THEN** no openspec CLI command invocations are found
