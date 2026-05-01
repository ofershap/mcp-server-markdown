## Context

The repository is configured for a judged workflow where operators launch
`/solve @task.md` and expect autonomous completion. Current behavior is good in
quality checks and code generation flow, but run-to-run reliability can degrade
because operational concerns are not formalized as strict protocol:
permissions preflight, deterministic fallback behavior, and explicit audit
output are not strongly codified.

The hackathon scoring model emphasizes correctness on both known and unknown
tasks, low regression risk, and consistency across repeated runs. The design
must improve repeatability without pre-implementing product features in advance.

## Goals / Non-Goals

**Goals:**

- Define a deterministic `/solve` execution contract that minimizes run variance.
- Make pre-start prerequisites explicit so post-start operator intervention is
  unlikely.
- Add workflow-level security and robustness checks for hidden-task readiness.
- Produce machine-readable execution evidence for judging and troubleshooting.
- Keep changes focused on workflow/orchestration artifacts, not product prebuild.

**Non-Goals:**

- Adding pre-implemented solutions for open/hidden feature tasks.
- Re-architecting the MCP server business logic in `src/` before `/solve`.
- Introducing mandatory third-party SaaS dependencies for run orchestration.

## Decisions

### 1. Introduce an explicit preflight contract before implementation steps

The `/solve` skill will define a strict preflight segment that verifies:

- task file path resolves and is readable;
- operator prerequisites are documented as pre-start only;
- runtime assumptions are pinned (Node LTS/pnpm available, repository writable).
- hooks configuration is present and valid for judged runs.

Rationale: preflight failures are cheaper and clearer than late-stage failures.
This directly improves autonomy and stability scoring.

Alternatives considered:

- Keep implicit assumptions in prose only: rejected as too ambiguous.
- Enforce environment setup via external wrapper script only: rejected because
  the judged entry point is `/solve @task.md`.

### 1a. Use Copilot CLI hooks for permission and telemetry control

The workflow will use repository hooks in `.github/hooks/*.json`:

- `permissionRequest` hook with strict allowlist for safe command patterns
  required by `/solve` (for example, `node`, `pnpm`, `npm`, bounded `git`
  reads), returning explicit allow/deny decisions;
- `preToolUse`/`postToolUse`/`postToolUseFailure` hooks to produce structured
  stage telemetry consumed by run reporting;
- optional `sessionStart` prompt hook for deterministic preflight reminders.

Rationale: hook-level policy reduces interactive permission prompts after start
while preserving security boundaries and improving auditable execution traces.

Alternatives considered:

- blanket `/allow-all` only: rejected as too broad for security posture.
- no hooks, skill-only control: rejected because permission flow can still
  introduce manual confirmation risk.

### 2. Standardize retries and fallback paths by failure class

Failures will be grouped into deterministic classes:

- quality gate failure;
- dependency/setup failure;
- transient command/tooling failure.

Each class gets a bounded retry policy and one fallback path. No open-ended
branching during `/solve`.

Rationale: bounded deterministic control flow improves repeatability across
three repeated judged runs.

Alternatives considered:

- Ad-hoc retries based on model judgment: rejected due to nondeterminism.
- Zero retries: rejected due to avoidable transient flake failures.

### 3. Add universal hidden-task readiness checks for new-tool changes

The workflow will require explicit verification checklist coverage:

- function contract in `src/markdown.ts`;
- MCP registration in `src/index.ts`;
- tests including edge/negative cases;
- ordered quality gate success.

Rationale: hidden tasks may differ in content but commonly require robust
tooling wiring and verification discipline.

Alternatives considered:

- Task-type-specific checklists only: rejected because hidden task type is unknown.

### 4. Add security-check and machine-readable run report stages

The workflow will emit a compact JSON run report (stage outcomes, retries,
failure class, final status) in session artifacts and include an explicit
security check stage (path handling, unsafe command patterns, untrusted input
handling, regression of prior safety constraints, hook policy correctness).

Rationale: helps judging transparency and post-run diagnosis while strengthening
bonus categories.

Alternatives considered:

- Human-readable summary only: rejected as insufficient for stable auditing.

## Risks / Trade-offs

- **[Risk] Increased workflow verbosity may consume context budget** →
  **Mitigation:** keep report schema compact; avoid duplicative logs.
- **[Risk] Over-constraining retries may block recoverable edge cases** →
  **Mitigation:** classify failures carefully and keep one explicit fallback path.
- **[Risk] Preflight wording may still be interpreted inconsistently by operators** →
  **Mitigation:** codify pre-start vs post-start actions with exact phrasing.
- **[Risk] Additional stages increase runtime** →
  **Mitigation:** lightweight checks only; no expensive duplicate test passes.
- **[Risk] Hook allowlist too permissive or too strict** →
  **Mitigation:** default-deny policy with explicit command/tool pattern tests
  and staged dry-runs.

## Migration Plan

1. Update `.github/skills/solve/SKILL.md` with preflight, deterministic retries,
   hidden-task checklist, security-check stage, and JSON run-report stage.
2. Add `.github/hooks/*.json` with allowlist-based permission decisions and
   telemetry hooks for tool outcomes.
3. Align `.github/copilot-instructions.md` and path-scoped instructions with the
   same contract language.
4. Update operator-facing docs to clarify pre-start prerequisites and judged-run
   launch procedure.
5. Validate by running representative `/solve @task.md` dry-runs and ensuring
   report artifacts are generated consistently.

Rollback strategy:

- Revert workflow artifact updates in one commit if the hardened flow causes
  unacceptable regressions in completion rate.

## Open Questions

- Should run-report artifacts be persisted under session state only, or also in
  repository-local temporary paths ignored by git?
- Should security-check stage be fail-hard or warn-only for specific classes?
- Should retry budgets differ between open and hidden tasks, or remain identical
  for scoring consistency?
