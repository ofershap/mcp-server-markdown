## MODIFIED Requirements

### Requirement: Spec-driven planning pipeline

The solve skill SHALL run a structured planning phase using GitHub Copilot CLI-native primitives before writing any product code. Planning MUST NOT depend on the `openspec` CLI executable.

#### Scenario: Codebase exploration before planning

- **WHEN** task analysis is complete
- **THEN** the agent spawns an `explore` sub-agent to read `src/markdown.ts` and `src/index.ts` and returns a summary of existing patterns before writing the plan

#### Scenario: Plan written to session file

- **WHEN** codebase exploration is complete
- **THEN** the agent writes a `plan.md` to the session state folder containing: problem statement, change type, implementation approach, input/output contract, edge cases, and any assumptions

#### Scenario: Tasks tracked in SQL

- **WHEN** the plan is complete
- **THEN** the agent inserts atomic implementation tasks into the SQL `todos` table (`id`, `title`, `description`, `status: 'pending'`) before writing any product code

#### Scenario: No OpenSpec CLI dependency

- **WHEN** the solve skill runs in any environment
- **THEN** it MUST NOT invoke `openspec` commands and MUST complete successfully using only GitHub Copilot CLI built-in tools

---

### Requirement: Implementation follows tasks artifact

The solve skill SHALL implement tasks from the SQL `todos` table sequentially, updating each task's status, and MUST NOT begin coding before tasks are inserted into the SQL table.

#### Scenario: Implementation follows plan

- **WHEN** tasks are in the SQL `todos` table with `status: 'pending'`
- **THEN** the agent sets each task to `in_progress`, implements it, then sets it to `done` before moving to the next task

#### Scenario: No premature code changes

- **WHEN** the SQL `todos` table has no tasks yet
- **THEN** the agent makes no edits to `src/` or `tests/`

#### Scenario: Task status is queryable

- **WHEN** checking progress during implementation
- **THEN** the agent can query `SELECT * FROM todos WHERE status != 'done'` to see remaining work
