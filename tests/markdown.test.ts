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
