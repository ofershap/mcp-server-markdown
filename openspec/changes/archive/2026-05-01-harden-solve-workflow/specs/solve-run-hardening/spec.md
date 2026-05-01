## ADDED Requirements

### Requirement: Deterministic solve preflight

The `/solve` workflow SHALL execute a deterministic preflight before any
implementation activity and SHALL fail fast if required prerequisites are not
satisfied.

#### Scenario: Valid preflight

- **WHEN** the operator runs `/solve @task.md` with a readable task file and
  supported runtime environment
- **THEN** the workflow records preflight success and proceeds to analysis

#### Scenario: Missing or unreadable task file

- **WHEN** the task file does not exist or cannot be read
- **THEN** the workflow stops immediately with a clear error and performs no
  code changes

### Requirement: Pre-start versus post-start operator contract

The workflow documentation SHALL explicitly separate allowed pre-start operator
actions from disallowed post-start interventions.

#### Scenario: Pre-start setup guidance

- **WHEN** a user reads workflow instructions before launching `/solve`
- **THEN** instructions clearly list prerequisite setup actions that must be
  completed before start

#### Scenario: Post-start autonomy requirement

- **WHEN** `/solve` has started
- **THEN** the workflow avoids requesting operator decisions during execution

### Requirement: Hook-based permission policy

The workflow SHALL define Copilot CLI hooks that apply a strict allowlist
permission policy for `/solve` tool execution.

#### Scenario: Allowed command request

- **WHEN** a tool call matches the configured safe allowlist policy
- **THEN** the hook layer returns an allow decision without manual confirmation

#### Scenario: Disallowed command request

- **WHEN** a tool call does not match the configured allowlist policy
- **THEN** the hook layer denies the request with a reason and the workflow
  continues via deterministic fallback or failure handling

### Requirement: Bounded retries and single fallback path

The `/solve` workflow SHALL use bounded retries and one deterministic fallback
path per failure class.

#### Scenario: Quality gate failure recovery

- **WHEN** a quality gate step fails
- **THEN** the workflow retries using the configured budget and then follows the
  defined fallback behavior if retries are exhausted

#### Scenario: Transient tooling failure recovery

- **WHEN** a transient command or tooling failure is detected
- **THEN** the workflow applies the transient-failure retry policy and does not
  branch into ad-hoc recovery paths

### Requirement: Universal hidden-task readiness checks

For new-tool tasks, the workflow SHALL verify a universal readiness checklist
covering logic contract, MCP registration, tests, and ordered quality gate.

#### Scenario: Checklist complete

- **WHEN** implementation is finished for a new-tool task
- **THEN** the workflow confirms checklist items for
  `src/markdown.ts`, `src/index.ts`, tests, and quality-gate completion before
  declaring success

#### Scenario: Checklist incomplete

- **WHEN** any required checklist item is missing
- **THEN** the workflow marks the run as incomplete and continues remediation
  rather than reporting completion

### Requirement: Security checks in solve pipeline

The `/solve` pipeline SHALL include an explicit security-check stage before
final completion.

#### Scenario: Security stage passes

- **WHEN** code and workflow changes satisfy defined security checks
- **THEN** the run report records a passed security stage

#### Scenario: Security stage fails

- **WHEN** a security check fails
- **THEN** the workflow records failure and does not report successful completion

### Requirement: Machine-readable run report

Each `/solve` run SHALL emit a machine-readable report describing stage outcomes
and final status.

#### Scenario: Successful run report

- **WHEN** `/solve` completes successfully
- **THEN** the report includes each stage result, retry counts, and final
  success status

#### Scenario: Failed run report

- **WHEN** `/solve` terminates with failure
- **THEN** the report includes the failed stage, failure class, retry usage, and
  final failure status

### Requirement: Hook telemetry integration

The run report SHALL include structured telemetry from hook events related to
tool success, tool failure, and permission decisions.

#### Scenario: Successful tool telemetry capture

- **WHEN** a tool call completes successfully
- **THEN** hook telemetry is captured and mapped to the corresponding workflow
  stage in the machine-readable report

#### Scenario: Failed tool telemetry capture

- **WHEN** a tool call fails or is denied by policy
- **THEN** hook telemetry captures the failure/deny reason and includes it in
  the run report output
