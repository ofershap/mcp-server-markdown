# GitHub Copilot Instructions — mcp-server-markdown

## Project Overview

`mcp-server-markdown` is an MCP server (Model Context Protocol) written in TypeScript that provides tools for working with markdown files: searching, extracting sections, listing headings, finding code blocks, and parsing frontmatter. Transport: stdio. Published as npm package `mcp-server-markdown`.

## Repository Structure

```
src/
  index.ts          # MCP server entry point — registers tools via server.tool()
  markdown.ts       # Core logic functions — exported async functions, tested independently
tests/
  markdown.test.ts  # Vitest unit tests using temp directories
.github/
  skills/           # Copilot CLI skill definitions
  prompts/          # OpenSpec prompt files
  workflows/        # CI/CD (ci.yml: lint→typecheck→build→test, release.yml)
  instructions/     # Path-scoped agent instructions
openspec/
  config.yaml       # Spec-driven workflow configuration
  changes/          # Active OpenSpec changes
  specs/            # Merged specification files
skills/
  markdown-search/  # Copilot CLI skill for using the MCP server
server.json         # MCP server manifest
package.json        # Scripts: build, test, lint, typecheck, format
```

## Tech Stack

- **Language**: TypeScript (ESM, `"module": "NodeNext"`, strict mode, `noUncheckedIndexedAccess: true`)
- **Runtime**: Node.js LTS (target: node20 / ES2022)
- **Package manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` — `McpServer`, `StdioServerTransport`
- **Validation**: Zod (inline schemas in every `server.tool()` call)
- **Build**: tsup → `dist/` (ESM only, sourcemap, shebang banner)
- **Tests**: vitest (node environment, v8 coverage)
- **Lint**: eslint (typescript-eslint strict + stylistic) + prettier
- **Git hooks**: husky + lint-staged

> **Scripting rule**: Node.js is the only guaranteed runtime. Always use `node` (or `pnpm`/`npx`) for any scripting, one-off tests, or automation. Never use `python`, `python3`, `ruby`, or other interpreted runtimes.

## Code Style Conventions

### Imports

- All local imports use `.js` extension (ESM requirement): `import { foo } from "./bar.js";`
- Node built-ins use `node:` prefix: `import fs from "node:fs/promises";`

### Formatting (enforced by prettier)

- Double quotes, semicolons, trailing commas, `printWidth: 80`, `tabWidth: 2`

### TypeScript strictness

- `noUncheckedIndexedAccess: true` — array/object indexed access returns `T | undefined`
- Always check for undefined before using indexed values:
  ```typescript
  const line = lines[i];
  if (line === undefined) continue;
  ```

### Tool implementation pattern

**Step 1 — Logic function in `src/markdown.ts`:**

```typescript
export async function myToolLogic(
  directory: string,
  option?: string,
): Promise<MyResult[]> {
  const absDir = path.resolve(directory);
  const stat = await fs.stat(absDir);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${directory}`);
  }
  // ... implementation
  return results;
}
```

**Step 2 — Register in `src/index.ts`:**

```typescript
server.tool(
  "my_tool_name",
  "Description of what the tool does.",
  {
    directory: z.string().describe("Path to the directory to scan"),
    option: z.string().optional().describe("Optional description"),
  },
  async ({ directory, option }) => {
    const absDir = path.resolve(directory);
    const results = await myToolLogic(absDir, option);
    const text = results.length > 0 ? JSON.stringify(results) : "(no results)";
    return { content: [{ type: "text" as const, text }] };
  },
);
```

**Key conventions:**

- `path.resolve()` on all file/directory inputs before use
- Zod schemas inline with `.describe()` on every field
- Return format: `{ content: [{ type: "text" as const, text }] }`
- JSON output for structured data; plain text for simple lists
- Errors throw `new Error(...)` — the MCP SDK handles them as tool errors

## Quality Gate

Run in this exact order. Fix any failures before declaring success.

```bash
pnpm run lint        # eslint + prettier check
pnpm run typecheck   # tsc --noEmit (no build output)
pnpm run build       # tsup → dist/
pnpm run test        # vitest run
```

All four steps must pass. On failure: diagnose the error, fix the code, and rerun. Retry up to 2 full cycles before reporting an unresolvable error.

## Change Patterns

### Pattern A — Adding a new tool

1. Add exported async function to `src/markdown.ts`
2. Register with `server.tool()` in `src/index.ts` (import the new function)
3. Add tests in `tests/markdown.test.ts` (see test conventions below)
4. Run quality gate

### Pattern B — Modifying an existing tool

1. Update the logic function in `src/markdown.ts`
2. Update `server.tool()` in `src/index.ts` if description or schema changes
3. Update or add tests — ensure existing tests still pass
4. Run quality gate

### Pattern C — Other changes (refactor, new module, non-tool feature)

1. Identify what files are affected
2. Make minimal, focused changes
3. Add or update tests as appropriate
4. Run quality gate — confirm zero regressions

## Autonomy Rules

**Never ask the operator for input after `/solve @task.md` is invoked.**

- If a task detail is ambiguous, make a reasonable decision and document the assumption in the OpenSpec proposal.
- If a quality gate step fails, diagnose and fix autonomously (up to 2 retries).
- If a dependency is missing (`pnpm install` needed), run it automatically.
- If an error is unrecoverable after 2 retries, report a concise error summary — do not ask what to do.

## Security Guidance

- **Path traversal**: Always use `path.resolve()` on user-supplied paths. Do not use string concatenation to build file paths.
- **Input sanitization**: Validate that directories exist and are directories before scanning; validate that files exist before reading.
- **Error isolation**: A single bad file must not fail an entire scan — catch per-file errors, skip the file, and continue.
- **Resource limits**: Be mindful of result set size; existing tools cap at 50 results. New tools should implement reasonable limits.

## Existing MCP Tools (for reference)

| Tool               | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `list_files`       | List all `.md` files in a directory recursively            |
| `search_docs`      | Full-text search across all `.md` files (up to 50 results) |
| `get_section`      | Extract a section by heading from a single file            |
| `list_headings`    | List all headings as a table of contents                   |
| `find_code_blocks` | Find fenced code blocks, optionally filter by language     |
| `get_frontmatter`  | Parse YAML frontmatter metadata from a file                |

## Solve Workflow Hardening (judged runs)

For `/solve @task.md` runs, follow this strict contract:

1. **Preflight first**: verify task readability, runtime availability, and hook config presence before implementation.
2. **No post-start operator dependency**: after `/solve` starts, do not ask for manual choices/confirmations.
3. **Deterministic fallback only**: use bounded retries and fixed failure-class fallback paths (no ad-hoc branching).
4. **Hidden-task readiness checklist**: for new tools, require logic + registration + tests + ordered quality gate before success.
5. **Security-check stage**: explicitly validate path safety, command safety posture, and hook policy correctness.
6. **Machine-readable run report**: always emit JSON stage outcomes; failure reports must include partial progress and failure class.

### Hooks policy expectations

- Hooks are configured under `.github/hooks/*.json`.
- Permission control uses an **allowlist + default deny** model.
- Hook decisions/telemetry are inputs to run reporting and stability diagnostics.
- Prefer narrow command allowances over broad `/allow-all` behavior in judged automation mode.
