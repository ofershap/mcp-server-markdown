## 1. Rewrite Solve Skill

- [ ] 1.1 Rewrite `.github/skills/solve/SKILL.md` — replace Step 2 (Spec-Driven Planning) with Copilot CLI-native planning: (a) spawn an `explore` sub-agent to read `src/markdown.ts` and `src/index.ts` and summarise existing patterns; (b) write a structured `plan.md` to the session state folder covering problem statement, change type, approach, input/output contract, edge cases, and assumptions; (c) insert atomic implementation tasks into the SQL `todos` table (`pending`) before writing any product code. Remove all `openspec` CLI commands. Keep Steps 1, 3, 4, 5, 6 unchanged.

## 2. Verification

- [ ] 2.1 Verify the rewritten `SKILL.md` contains no `openspec` CLI commands (no `openspec new change`, `openspec status`, `openspec instructions`)
- [ ] 2.2 Verify the rewritten `SKILL.md` contains the SQL todos pattern (`INSERT INTO todos`, `UPDATE todos SET status`)
- [ ] 2.3 Verify the rewritten `SKILL.md` contains the plan.md writing step referencing the session state folder
- [ ] 2.4 Verify the rewritten `SKILL.md` retains: task analysis (Step 1), implementation (Step 3), rubber-duck review (Step 4), quality gate (Step 5), completion report (Step 6)
- [ ] 2.5 Confirm no changes were made to `src/`, `tests/`, `.github/copilot-instructions.md`, or any instruction files
