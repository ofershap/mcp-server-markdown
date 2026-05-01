## 1. Solve skill hardening

- [x] 1.1 Add a deterministic preflight section to `.github/skills/solve/SKILL.md` with explicit fail-fast criteria.
- [x] 1.2 Define bounded retry budgets and one fallback path per failure class in the solve pipeline.
- [x] 1.3 Add a universal hidden-task readiness checklist stage (logic contract, MCP registration, tests, ordered quality gate).

## 2. Hooks policy and automation

- [x] 2.1 Create `.github/hooks/` configuration with `permissionRequest` allowlist policy for safe `/solve` command patterns.
- [x] 2.2 Add hook handling for denied requests with clear reason text and deterministic fallback mapping.
- [x] 2.3 Add hook telemetry wiring (`postToolUse`, `postToolUseFailure`, optional `notification`) for stage-level run reporting.

## 3. Security and run evidence

- [x] 3.1 Add an explicit security-check stage to the solve workflow before completion reporting.
- [x] 3.2 Add a machine-readable run-report specification (stage statuses, retries, failure class, final outcome) and wire it into workflow instructions.
- [x] 3.3 Ensure failure runs also emit report output with partial stage results.

## 4. Instruction and documentation alignment

- [x] 4.1 Update `.github/copilot-instructions.md` to align with preflight contract, hooks policy, and deterministic retry policy.
- [x] 4.2 Update path-specific instruction files under `.github/instructions/` to reflect hidden-task readiness and hook-based security/reporting expectations.
- [x] 4.3 Update human-facing run documentation to explicitly separate pre-start setup from disallowed post-start interaction.

## 5. Verification

- [x] 5.1 Dry-run `/solve @task.md` on the open task and confirm all new workflow stages execute in order.
- [x] 5.2 Validate that the run report is produced for both success and failure paths, including hook telemetry and deny reasons.
- [x] 5.3 Run repository quality gate (`pnpm run lint`, `pnpm run typecheck`, `pnpm run build`, `pnpm run test`) after workflow changes.
