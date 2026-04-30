---
applyTo: "src/**"
---

# Instructions for `src/` — mcp-server-markdown

## File Roles

- **`src/markdown.ts`** — all core logic. Every function that reads files or processes markdown lives here as an exported async function.
- **`src/index.ts`** — server entry point only. Imports functions from `markdown.ts`, registers them as MCP tools, starts the server. Contains no business logic.

## Adding Logic (`src/markdown.ts`)

### Function signature template

```typescript
export async function myFunction(
  param: string,
  optionalParam?: string,
): Promise<ResultType[]> {
  const absPath = path.resolve(param);
  // ... validate, process, return
}
```

### Mandatory conventions

- Use `path.resolve()` on every user-supplied file or directory path
- All file I/O uses `node:fs/promises` (async — never sync)
- All imports use `.js` extension: `import { foo } from "./bar.js";`
- Node built-ins use `node:` prefix: `import path from "node:path";`

### `noUncheckedIndexedAccess` — required patterns

TypeScript is configured with `noUncheckedIndexedAccess: true`. Any array or object index returns `T | undefined`. Always guard:

```typescript
// Arrays
const line = lines[i];
if (line === undefined) continue;

// Regex matches
const match = line.match(/pattern/);
if (match && match[1] !== undefined) {
  const value = match[1]; // now string, not string | undefined
}

// Object spread (use optional chaining)
const val = obj.key ?? defaultValue;
```

### Error handling

- Validate directory inputs: `if (!stat.isDirectory()) throw new Error(...)`
- Per-file errors in scans: catch and `continue` — one bad file must not abort the whole scan
- Let errors from a single-file function propagate naturally (MCP SDK catches them)

## Registering a Tool (`src/index.ts`)

### Template

```typescript
server.tool(
  "snake_case_name",
  "One sentence describing what the tool does and what it returns.",
  {
    directory: z
      .string()
      .describe("Path to the directory to scan (e.g. ./docs)"),
    optionalField: z
      .string()
      .optional()
      .describe("Optional: description of what this controls"),
  },
  async ({ directory, optionalField }) => {
    const absDir = path.resolve(directory);
    const results = await myFunction(absDir, optionalField);
    const text =
      results.length > 0
        ? JSON.stringify({ results }, null, 2)
        : "(no results)";
    return { content: [{ type: "text" as const, text }] };
  },
);
```

### Zod schema rules

- Every field MUST have `.describe()`
- Optional fields use `.optional()` after the type: `z.string().optional()`
- Boolean flags: `z.boolean().optional().describe("...")`
- Arrays: `z.array(z.string()).optional().describe("...")`

### Return format

- Always: `{ content: [{ type: "text" as const, text }] }`
- `type: "text" as const` is required (TypeScript const assertion)
- For structured data: `JSON.stringify(obj, null, 2)`
- For lists: `items.join("\n")`
- For empty results: use a descriptive string like `"(no results)"` or `"(no matches)"`

### Import new functions

Add the function name to the import at the top of `index.ts`:

```typescript
import {
  existingFunction,
  myNewFunction, // add here
} from "./markdown.js";
```
