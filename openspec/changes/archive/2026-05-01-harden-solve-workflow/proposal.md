## Why

The current `/solve` workflow is strong functionally, but it still has avoidable
operational risk during judged runs: permission confirmations, execution
variance between runs, and weak explicit reporting for security/stability
evidence. This reduces reliability against the hackathon scoring model.

## What Changes

- Add a deterministic `/solve` preflight phase that enforces run prerequisites
  and declares hard fail-fast rules before implementation starts.
- Standardize `/solve` execution with a stricter step contract, bounded retries,
  and a single fallback path for common failure classes.
- Add universal hidden-task readiness checks for new-tool tasks (schema,
  registration, tests, quality-gate) as mandatory completion criteria.
- Add explicit security-check and machine-readable run-report stages so each run
  produces auditable evidence of what passed/failed.
- Add GitHub Copilot CLI hooks in `.github/hooks/*.json` to reduce permission
  friction safely (allowlist-based decisions) and to capture run telemetry.
- Update workflow docs/instructions to clearly separate **pre-start operator
  actions** (allowed) from **post-start interaction** (disallowed and penalized).

## Capabilities

### New Capabilities

- `solve-run-hardening`: deterministic preflight, strict retries/fallback, and
  auditable run reporting for `/solve`.

### Modified Capabilities

- _None_.

## Impact

- Affected artifacts:
  - `.github/skills/solve/SKILL.md`
  - `.github/hooks/*.json`
  - `.github/copilot-instructions.md`
  - `.github/instructions/src.instructions.md`
  - `.github/instructions/tests.instructions.md`
  - documentation files describing run procedure
- No product pre-implementation changes to MCP server business logic are
  required by this proposal.
- Improves judged-run consistency and evidence quality for categories:
  autonomy/stability, reliability in edge conditions, security checks,
  documentation, and CI quality traceability.
