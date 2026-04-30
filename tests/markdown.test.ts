import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  listMarkdownFiles,
  searchDocs,
  getSection,
  listHeadings,
  findCodeBlocks,
  getFrontmatter,
  findTodos,
} from "../src/markdown.js";

const SAMPLE_MD = `---
title: Test Document
author: Test Author
---

# Introduction

This is the introduction section.

## Getting Started

Here's how to get started with the project.

\`\`\`typescript
const x = 1;
console.log(x);
\`\`\`

## API Reference

The API has these endpoints.

\`\`\`python
def hello():
    return "world"
\`\`\`

### Authentication

You need a token to authenticate.
`;

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-markdown-"));
  await fs.writeFile(path.join(tmpDir, "README.md"), SAMPLE_MD);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("listMarkdownFiles", () => {
  it("returns .md files in directory", async () => {
    const files = await listMarkdownFiles(tmpDir);
    expect(files).toContain("README.md");
    expect(files.length).toBe(1);
  });

  it("returns files sorted alphabetically", async () => {
    await fs.writeFile(path.join(tmpDir, "a.md"), "# A");
    await fs.writeFile(path.join(tmpDir, "z.md"), "# Z");
    const files = await listMarkdownFiles(tmpDir);
    expect(files).toEqual(["README.md", "a.md", "z.md"]);
  });

  it("recursively finds .md in subdirectories", async () => {
    await fs.mkdir(path.join(tmpDir, "nested"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, "nested", "guide.md"), "# Guide");
    const files = await listMarkdownFiles(tmpDir);
    expect(files).toContain("nested/guide.md");
    expect(files).toContain("README.md");
  });

  it("throws when directory does not exist", async () => {
    await expect(listMarkdownFiles("/nonexistent/path")).rejects.toThrow();
  });
});

describe("searchDocs", () => {
  it("finds lines matching query (case-insensitive)", async () => {
    const results = await searchDocs(tmpDir, "introduction");
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.content.toLowerCase()).toContain("introduction");
      expect(first.file).toBe("README.md");
    }
  });

  it("returns file, line, and content", async () => {
    const results = await searchDocs(tmpDir, "token");
    expect(results[0]).toEqual({
      file: "README.md",
      line: 30,
      content: "You need a token to authenticate.",
    });
  });

  it("limits to 50 results", async () => {
    for (let i = 0; i < 60; i++) {
      await fs.writeFile(
        path.join(tmpDir, `f${i}.md`),
        "auth token\n".repeat(10),
      );
    }
    const results = await searchDocs(tmpDir, "auth");
    expect(results.length).toBe(50);
  });
});

describe("getSection", () => {
  it("extracts section by heading", async () => {
    const content = await getSection(
      path.join(tmpDir, "README.md"),
      "Introduction",
    );
    expect(content).toContain("# Introduction");
    expect(content).toContain("This is the introduction section");
  });

  it("stops at next heading of same level", async () => {
    const content = await getSection(
      path.join(tmpDir, "README.md"),
      "Getting Started",
    );
    expect(content).toContain("Getting Started");
    expect(content).toContain("const x = 1");
    expect(content).not.toContain("API Reference");
  });

  it("returns empty when heading not found", async () => {
    const content = await getSection(
      path.join(tmpDir, "README.md"),
      "Nonexistent Section",
    );
    expect(content).toBe("");
  });
});

describe("listHeadings", () => {
  it("returns all headings with level, text, line", async () => {
    const headings = await listHeadings(path.join(tmpDir, "README.md"));
    expect(headings).toContainEqual({
      level: 1,
      text: "Introduction",
      line: 6,
    });
    expect(headings).toContainEqual({
      level: 2,
      text: "Getting Started",
      line: 10,
    });
    expect(headings).toContainEqual({
      level: 2,
      text: "API Reference",
      line: 19,
    });
    expect(headings).toContainEqual({
      level: 3,
      text: "Authentication",
      line: 28,
    });
  });
});

describe("findCodeBlocks", () => {
  it("finds all code blocks when no language filter", async () => {
    const blocks = await findCodeBlocks(path.join(tmpDir, "README.md"));
    expect(blocks.length).toBe(2);
    const [ts, py] = blocks;
    expect(ts).toBeDefined();
    expect(py).toBeDefined();
    if (ts) expect(ts.language).toBe("typescript");
    if (ts) expect(ts.code).toContain("const x = 1");
    if (py) expect(py.language).toBe("python");
    if (py) expect(py.code).toContain("def hello()");
  });

  it("filters by language when specified", async () => {
    const blocks = await findCodeBlocks(
      path.join(tmpDir, "README.md"),
      "typescript",
    );
    expect(blocks.length).toBe(1);
    const first = blocks[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.language).toBe("typescript");
      expect(first.code).toContain("console.log(x)");
    }
  });

  it("returns empty when no matching blocks", async () => {
    const blocks = await findCodeBlocks(path.join(tmpDir, "README.md"), "rust");
    expect(blocks).toEqual([]);
  });
});

describe("getFrontmatter", () => {
  it("parses YAML frontmatter", async () => {
    const fm = await getFrontmatter(path.join(tmpDir, "README.md"));
    expect(fm).toEqual({
      title: "Test Document",
      author: "Test Author",
    });
  });

  it("returns null when no frontmatter", async () => {
    await fs.writeFile(
      path.join(tmpDir, "plain.md"),
      "# No Frontmatter\n\nBody.",
    );
    const fm = await getFrontmatter(path.join(tmpDir, "plain.md"));
    expect(fm).toBeNull();
  });
});

describe("findTodos", () => {
  it("finds TODO, FIXME, NOTE by default", async () => {
    await fs.writeFile(
      path.join(tmpDir, "guide.md"),
      [
        "<!-- TODO: update screenshot -->",
        "FIXME: broken link here",
        "NOTE: see documentation",
        "Nothing here",
      ].join("\n"),
    );
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(3);

    const todo = items[0];
    expect(todo).toBeDefined();
    if (todo) {
      expect(todo.file).toBe("guide.md");
      expect(todo.line).toBe(1);
      expect(todo.marker).toBe("TODO");
      expect(todo.text).toBe("update screenshot -->");
    }

    const fixme = items[1];
    expect(fixme).toBeDefined();
    if (fixme) {
      expect(fixme.marker).toBe("FIXME");
      expect(fixme.text).toBe("broken link here");
    }

    const note = items[2];
    expect(note).toBeDefined();
    if (note) {
      expect(note.marker).toBe("NOTE");
      expect(note.text).toBe("see documentation");
    }
  });

  it("does not match marker as part of a longer word", async () => {
    await fs.writeFile(
      path.join(tmpDir, "notes.md"),
      "This is notable\nTODOS: not a match\nTODO: this matches",
    );
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();
    if (item) expect(item.marker).toBe("TODO");
  });

  it("returns empty array when no markers found", async () => {
    await fs.writeFile(
      path.join(tmpDir, "clean.md"),
      "# Clean doc\n\nNo annotations here.",
    );
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(0);
  });

  it("throws for non-existent directory", async () => {
    await expect(findTodos("/nonexistent/path")).rejects.toThrow();
  });

  it("throws for file path instead of directory", async () => {
    await expect(findTodos(path.join(tmpDir, "README.md"))).rejects.toThrow(
      "Not a directory",
    );
  });

  it("custom markers override default list entirely", async () => {
    await fs.writeFile(
      path.join(tmpDir, "mixed.md"),
      "TODO: old\nHACK: workaround",
    );
    const items = await findTodos(tmpDir, { markers: ["HACK"] });
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();
    if (item) {
      expect(item.marker).toBe("HACK");
      expect(item.text).toBe("workaround");
    }
  });

  it("empty markers array returns no results", async () => {
    await fs.writeFile(
      path.join(tmpDir, "todos.md"),
      "TODO: something\nFIXME: broken",
    );
    const items = await findTodos(tmpDir, { markers: [] });
    expect(items).toHaveLength(0);
  });

  it("case-insensitive by default: matches todo, Todo, TODO", async () => {
    await fs.writeFile(
      path.join(tmpDir, "case.md"),
      "todo: lowercase\nTodo: mixed\nTODO: upper",
    );
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(3);
    // marker field reflects actual casing found
    const markers = items.map((i) => i.marker);
    expect(markers).toContain("todo");
    expect(markers).toContain("Todo");
    expect(markers).toContain("TODO");
  });

  it("case-insensitive by default: fixme matches", async () => {
    await fs.writeFile(path.join(tmpDir, "lower.md"), "fixme: broken link");
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();
    if (item) {
      expect(item.marker).toBe("fixme");
      expect(item.text).toBe("broken link");
    }
  });

  it("caseSensitive=true does not match lowercase fixme against FIXME", async () => {
    await fs.writeFile(path.join(tmpDir, "cs.md"), "fixme: broken link");
    const items = await findTodos(tmpDir, { caseSensitive: true });
    expect(items).toHaveLength(0);
  });

  it("caseSensitive=true matches exact case", async () => {
    await fs.writeFile(
      path.join(tmpDir, "cs.md"),
      "FIXME: broken link\nfixme: also broken",
    );
    const items = await findTodos(tmpDir, { caseSensitive: true });
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();
    if (item) expect(item.marker).toBe("FIXME");
  });

  it("matches markers inside fenced code blocks", async () => {
    await fs.writeFile(
      path.join(tmpDir, "code.md"),
      ["```", "// TODO: refactor this", "```"].join("\n"),
    );
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();
    if (item) expect(item.text).toBe("refactor this");
  });

  it("strips colon after marker from text", async () => {
    await fs.writeFile(
      path.join(tmpDir, "colon.md"),
      "TODO: with colon\nTODO without colon",
    );
    const items = await findTodos(tmpDir);
    const withColon = items.find((i) => i.line === 1);
    const withoutColon = items.find((i) => i.line === 2);
    expect(withColon).toBeDefined();
    if (withColon) expect(withColon.text).toBe("with colon");
    expect(withoutColon).toBeDefined();
    if (withoutColon) expect(withoutColon.text).toBe("without colon");
  });

  it("scans nested directories recursively", async () => {
    const sub = path.join(tmpDir, "sub");
    await fs.mkdir(sub);
    await fs.writeFile(path.join(sub, "nested.md"), "TODO: nested item");
    const items = await findTodos(tmpDir);
    const nested = items.find((i) => i.file === path.join("sub", "nested.md"));
    expect(nested).toBeDefined();
  });

  it("results are sorted by file then line", async () => {
    await fs.writeFile(path.join(tmpDir, "b.md"), "TODO: b-file");
    await fs.writeFile(path.join(tmpDir, "a.md"), "TODO: line1\nFIXME: line2");
    const items = await findTodos(tmpDir);
    // a.md comes before b.md alphabetically
    expect(items[0]?.file).toBe("a.md");
    expect(items[1]?.file).toBe("a.md");
    expect(items[2]?.file).toBe("b.md");
  });

  it("skips unreadable files without aborting", async () => {
    const badFile = path.join(tmpDir, "bad.md");
    await fs.writeFile(badFile, "TODO: hidden");
    await fs.chmod(badFile, 0o000);
    try {
      const items = await findTodos(tmpDir);
      expect(Array.isArray(items)).toBe(true);
    } finally {
      await fs.chmod(badFile, 0o644);
    }
  });

  it("marker appears in HTML comment", async () => {
    await fs.writeFile(
      path.join(tmpDir, "html.md"),
      "<!-- TODO: update screenshot -->",
    );
    const items = await findTodos(tmpDir);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toBeDefined();
    if (item) {
      expect(item.marker).toBe("TODO");
      expect(item.text).toBe("update screenshot -->");
    }
  });
});
