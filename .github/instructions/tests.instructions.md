---
applyTo: "tests/**"
---

# Instructions for `tests/` — mcp-server-markdown

## File Role

- **`tests/markdown.test.ts`** — all unit tests for functions exported from `src/markdown.ts`. Tests are isolated from the file system using temp directories.

## Test Structure

### File layout
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { myFunction } from "../src/markdown.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-markdown-"));
  // set up fixture files
  await fs.writeFile(path.join(tmpDir, "README.md"), SAMPLE_CONTENT);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("myFunction", () => {
  it("does the expected thing", async () => {
    const result = await myFunction(tmpDir);
    expect(result).toEqual(/* ... */);
  });
});
```

### Key conventions
- Always use `beforeEach` + `afterEach` with `fs.mkdtemp()` for full isolation
- Always clean up with `fs.rm(tmpDir, { recursive: true, force: true })`
- Imports use `.js` extension: `from "../src/markdown.js"`
- Use `describe` blocks to group tests by function name
- Each `it` should have a single, focused assertion

## Required Coverage for Every New Function

### 1. Happy path
The normal case with valid input — does it return the expected result?

```typescript
it("returns results for valid directory", async () => {
  await fs.writeFile(path.join(tmpDir, "doc.md"), "# Heading\n\nContent");
  const results = await myFunction(tmpDir);
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({ /* expected fields */ });
});
```

### 2. Empty results
When input is valid but matches nothing:

```typescript
it("returns empty array when no matches", async () => {
  await fs.writeFile(path.join(tmpDir, "empty.md"), "no matches here");
  const results = await myFunction(tmpDir, "nonexistent");
  expect(results).toEqual([]);
});
```

### 3. Invalid / missing input
Directory that doesn't exist or isn't a directory:

```typescript
it("throws for non-existent directory", async () => {
  await expect(myFunction("/does/not/exist")).rejects.toThrow();
});

it("throws for file path instead of directory", async () => {
  const filePath = path.join(tmpDir, "file.md");
  await fs.writeFile(filePath, "content");
  await expect(myFunction(filePath)).rejects.toThrow();
});
```

### 4. Edge cases (required — pick all that apply to the function)

```typescript
// Empty file
it("handles empty file gracefully", async () => {
  await fs.writeFile(path.join(tmpDir, "empty.md"), "");
  const results = await myFunction(tmpDir);
  expect(results).toEqual([]);
});

// Nested directories
it("scans subdirectories recursively", async () => {
  await fs.mkdir(path.join(tmpDir, "sub"));
  await fs.writeFile(path.join(tmpDir, "sub", "nested.md"), "# Nested");
  const results = await myFunction(tmpDir);
  expect(results.some(r => r.file.includes("nested.md"))).toBe(true);
});

// Multiple files
it("processes multiple files", async () => {
  await fs.writeFile(path.join(tmpDir, "a.md"), "# A");
  await fs.writeFile(path.join(tmpDir, "b.md"), "# B");
  const results = await myFunction(tmpDir);
  expect(results.length).toBeGreaterThanOrEqual(2);
});

// Non-.md files ignored
it("ignores non-markdown files", async () => {
  await fs.writeFile(path.join(tmpDir, "data.json"), '{"key":"value"}');
  const results = await myFunction(tmpDir);
  expect(results.every(r => r.file.endsWith(".md"))).toBe(true);
});
```

### 5. Robustness / security edge cases (where applicable)

```typescript
// Malformed content
it("handles malformed markdown without throwing", async () => {
  await fs.writeFile(path.join(tmpDir, "malformed.md"), "```\nunclosed code block");
  await expect(myFunction(tmpDir)).resolves.toBeDefined();
});

// Large content
it("handles files with many items", async () => {
  const lines = Array.from({ length: 100 }, (_, i) => `# Heading ${i}`).join("\n");
  await fs.writeFile(path.join(tmpDir, "large.md"), lines);
  const results = await myFunction(tmpDir);
  expect(results.length).toBeGreaterThan(0);
});
```

## Test Naming Conventions

- `it("returns <thing> for <condition>")` — positive assertions
- `it("throws for <bad condition>")` — error cases
- `it("handles <edge case> gracefully")` — robustness

## Vitest Matchers Quick Reference

```typescript
expect(value).toBe(exact)             // strict equality
expect(value).toEqual(deep)           // deep equality
expect(value).toMatchObject(partial)  // partial match
expect(value).toHaveLength(n)
expect(value).toContain(item)
expect(value).toBeGreaterThan(n)
expect(fn).rejects.toThrow()          // async error
expect(fn).resolves.toBeDefined()     // async success
```
