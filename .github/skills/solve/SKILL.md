---
name: solve
description: Autonomous end-to-end task solver for mcp-server-markdown. Reads a task file, runs the full spec-driven pipeline, implements the changes, reviews the code, and verifies the quality gate — all without operator input.
license: MIT
compatibility: GitHub Copilot CLI
metadata:
  author: mcp-server-markdown
  version: "1.0"
  generatedBy: "1.0.0"
---

Implement the task described in the provided file, end-to-end, autonomously.

**Entry point**: `/solve @task.md`

**Autonomy rule**: Complete the entire pipeline without asking the operator any questions. If a detail is ambiguous, make a reasonable assumption, document it in the plan, and continue.

**No commits**: Do not run `git commit` or `git push` at any point. Leave all changes staged or unstaged for the operator to review and commit manually.

---

## Step 1 — Read and Analyse the Task

Read the task file provided as input (`@task.md`). Extract:

- What needs to be built or changed
- The name of the new tool, function, or feature (if any)
- Required input/output contracts
- Specific rules and constraints
- Any examples provided

Determine the **change type**:

- **new-tool**: Task asks to add a new MCP tool → use Pattern A from `.github/copilot-instructions.md`
- **modification**: Task asks to change an existing tool or function → use Pattern B
- **other**: Any other change → use Pattern C

Derive a **kebab-case change name** from the task (e.g., tool `find_links` → `find-links`, tool `extract_headings` → `extract-headings`).

If the task file is missing or unreadable, report the error and stop — make no code changes.

---

## Step 2 — Explore and Plan

### 2a. Explore the codebase

Use the `explore` agent (via the task tool with `agent_type: "explore"`, `model: "claude-haiku-4.5"`) to read:

- `src/markdown.ts` — existing logic functions, patterns, types
- `src/index.ts` — existing tool registrations, import style, return format

Ask the explore agent: "Summarise the existing function patterns, TypeScript types, import conventions, and tool registration style in these files. Identify any patterns relevant to implementing a new tool or modifying an existing one."

### 2b. Write a plan

Write a `plan.md` to the session state folder (the path is shown in the session context as "Plan file:"). The plan must cover:

```
# Plan: <change-name>

## Problem
<1-2 sentences from the task description>

## Change type
<new-tool | modification | other>

## Approach
<How the implementation will work — algorithm, data structures, parsing approach>

## Function signature (src/markdown.ts)
<export async function name(params): Promise<ReturnType>>

## Tool registration (src/index.ts)
<tool name, description, Zod schema fields>

## Edge cases to handle
<list all edge cases from the task rules>

## Assumptions
<any decisions made due to task ambiguity>
```

### 2c. Insert tasks into SQL todos

Insert all implementation tasks into the SQL `todos` table before writing any code:

```sql
INSERT INTO todos (id, title, description) VALUES
  ('<change>-logic',    'Logic function',      'Implement export async function in src/markdown.ts'),
  ('<change>-register', 'Register tool',       'Register server.tool() in src/index.ts, add import'),
  ('<change>-tests',    'Write tests',         'Add vitest tests in tests/markdown.test.ts'),
  ('<change>-gate',     'Run quality gate',    'pnpm run lint && typecheck && build && test');
```

Do not write any product code until all todos are inserted.

---

## Step 3 — Implementation

Work through each SQL todo in order. Before starting each:

```sql
UPDATE todos SET status = 'in_progress' WHERE id = '<id>';
```

After completing each:

```sql
UPDATE todos SET status = 'done' WHERE id = '<id>';
```

### Task: Logic function (`src/markdown.ts`)

Follow the pattern from the explore output and `.github/instructions/src.instructions.md`:

```typescript
export async function myFunction(
  directory: string,
  option?: string,
): Promise<ResultType[]> {
  const absDir = path.resolve(directory);
  const stat = await fs.stat(absDir);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${directory}`);
  }
  // implementation
  return results;
}
```

Key rules (from `.github/copilot-instructions.md`):

- All imports use `.js` extension
- `path.resolve()` on every user-supplied path
- `noUncheckedIndexedAccess`: guard every array/object index access (`if (val === undefined) continue`)
- Per-file errors in scans: catch and continue — one bad file must not abort the whole scan

### Task: Register tool (`src/index.ts`)

```typescript
server.tool(
  "tool_name",
  "One sentence description.",
  {
    directory: z.string().describe("Path to the directory to scan"),
    optionalFlag: z.boolean().optional().describe("Optional: what this does"),
  },
  async ({ directory, optionalFlag }) => {
    const absDir = path.resolve(directory);
    const results = await myFunction(absDir, optionalFlag);
    const text =
      results.length > 0 ? JSON.stringify({ results }) : "(no results)";
    return { content: [{ type: "text" as const, text }] };
  },
);
```

Add the new function to the import at the top of `index.ts`.

### Task: Write tests (`tests/markdown.test.ts`)

Follow `.github/instructions/tests.instructions.md`. Required test coverage:

1. **Happy path** — valid input, expected results returned
2. **Empty results** — valid input but nothing matches
3. **Invalid input** — non-existent directory, file path instead of directory
4. **Edge cases** — all specific rules from the task (filtering flags, validation logic, boundary values)
5. **Robustness** — malformed content doesn't throw, nested directories work, multiple files work

---

## Step 4 — Independent Code Review

After all implementation todos are `done`, use the `rubber-duck` agent (via task tool with `agent_type: "rubber-duck"`, `model: "gpt-5.4"`) to review the changes.

Provide the rubber-duck agent with:

- The task requirements (from the task file)
- The plan (from `plan.md`)
- The new function in `src/markdown.ts`
- The tool registration in `src/index.ts`
- The new tests in `tests/markdown.test.ts`

Ask it to check:

- Does the implementation match **all** task rules and constraints?
- Are all edge cases handled correctly?
- Any TypeScript type safety issues (`noUncheckedIndexedAccess`)?
- Is the test coverage complete for all spec scenarios?

If the rubber-duck identifies a bug or logic error: fix it before proceeding. Re-invoke the rubber-duck only if the fix is non-trivial.

---

## Step 5 — Quality Gate

Run the full quality gate in this exact order:

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
```

All four steps must pass. If any step fails:

1. Read the full error output
2. Fix the root cause (lint errors, type errors, test failures)
3. Rerun the quality gate from the beginning
4. Retry up to **2 full cycles**

**Regression rule**: If `pnpm run test` fails on tests that existed before this change, treat it as a blocking error and fix before declaring success.

If the quality gate still fails after 2 retry cycles, report a concise error summary — do not ask the operator for input.

---

## Step 6 — Completion Report

When the quality gate passes, produce this summary:

```
## ✅ Task Complete

**Change:** <change-name>
**Type:** <new-tool | modification | other>

### Implemented
- `src/markdown.ts`: <function name and brief description>
- `src/index.ts`: registered tool `<tool_name>`
- `tests/markdown.test.ts`: <N> new test cases

### Quality Gate
- ✓ lint
- ✓ typecheck
- ✓ build
- ✓ test (<N> tests passed)

### Assumptions
<list any assumptions made due to task ambiguity, or "none">
```

---

## Reference: Change Patterns

### Pattern A — Adding a new tool

1. Implement exported async function in `src/markdown.ts`
2. Register with `server.tool()` in `src/index.ts`, add to imports
3. Add tests in `tests/markdown.test.ts`
4. Run quality gate

### Pattern B — Modifying an existing tool

1. Update the logic function in `src/markdown.ts`
2. Update `server.tool()` in `src/index.ts` if description/schema changed
3. Update/add tests — ensure pre-existing tests still pass
4. Run quality gate

### Pattern C — Other change

1. Identify affected files
2. Make minimal, focused changes
3. Add or update tests as appropriate
4. Run quality gate — confirm zero regressions
