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
  findLinks,
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

describe("findLinks", () => {
  it("finds inline links, images, and reference links", async () => {
    await fs.writeFile(
      path.join(tmpDir, "links.md"),
      [
        "See [API](../api.md#intro)",
        "![Logo](../logo.png)",
        "[Install guide][install]",
        "[Site](https://example.com)",
        "",
        "[install]: ../install.md",
      ].join("\n"),
    );

    const results = await findLinks(tmpDir);
    expect(results).toHaveLength(4);

    const link = results[0];
    expect(link).toBeDefined();
    if (link) {
      expect(link.file).toBe("links.md");
      expect(link.line).toBe(1);
      expect(link.column).toBe(5);
      expect(link.kind).toBe("link");
      expect(link.text).toBe("API");
      expect(link.target).toBe("../api.md#intro");
      expect(link.status).toBe("skipped");
    }

    const image = results[1];
    expect(image).toBeDefined();
    if (image) {
      expect(image.line).toBe(2);
      expect(image.column).toBe(1);
      expect(image.kind).toBe("image");
      expect(image.text).toBe("Logo");
      expect(image.status).toBe("skipped");
    }

    const ref = results[2];
    expect(ref).toBeDefined();
    if (ref) {
      expect(ref.line).toBe(3);
      expect(ref.column).toBe(1);
      expect(ref.kind).toBe("reference");
      expect(ref.text).toBe("Install guide");
      expect(ref.target).toBe("../install.md");
      expect(ref.status).toBe("skipped");
    }

    const ext = results[3];
    expect(ext).toBeDefined();
    if (ext) {
      expect(ext.kind).toBe("link");
      expect(ext.status).toBe("external");
    }
  });

  it("returns empty array when no links exist", async () => {
    await fs.writeFile(
      path.join(tmpDir, "plain.md"),
      "# No links here\n\nJust plain text.",
    );
    const results = await findLinks(tmpDir);
    expect(results).toHaveLength(0);
  });

  it("throws for non-existent directory", async () => {
    await expect(findLinks("/nonexistent/path")).rejects.toThrow();
  });

  it("throws for file path instead of directory", async () => {
    const filePath = path.join(tmpDir, "README.md");
    await expect(findLinks(filePath)).rejects.toThrow("Not a directory");
  });

  it("excludes images when includeImages is false", async () => {
    await fs.writeFile(
      path.join(tmpDir, "mixed.md"),
      "![Logo](logo.png)\n[Link](page.md)",
    );
    const results = await findLinks(tmpDir, { includeImages: false });
    expect(results.every((r) => r.kind !== "image")).toBe(true);
    expect(results.some((r) => r.kind === "link")).toBe(true);
  });

  it("excludes external links when includeExternal is false", async () => {
    await fs.writeFile(
      path.join(tmpDir, "mixed.md"),
      "[Local](page.md)\n[Site](https://example.com)",
    );
    const results = await findLinks(tmpDir, { includeExternal: false });
    expect(results.every((r) => r.status !== "external")).toBe(true);
    expect(results).toHaveLength(1);
  });

  it("validateLocal: ok for existing file", async () => {
    await fs.writeFile(path.join(tmpDir, "target.md"), "# Hello");
    await fs.writeFile(path.join(tmpDir, "source.md"), "[Link](target.md)");
    const results = await findLinks(tmpDir, { validateLocal: true });
    const link = results.find((r) => r.target === "target.md");
    expect(link).toBeDefined();
    if (link) expect(link.status).toBe("ok");
  });

  it("validateLocal: missing_file for absent file", async () => {
    await fs.writeFile(path.join(tmpDir, "source.md"), "[Link](missing.md)");
    const results = await findLinks(tmpDir, { validateLocal: true });
    const link = results[0];
    expect(link).toBeDefined();
    if (link) expect(link.status).toBe("missing_file");
  });

  it("validateLocal: ok for existing anchor", async () => {
    await fs.writeFile(path.join(tmpDir, "target.md"), "# anchor");
    await fs.writeFile(
      path.join(tmpDir, "source.md"),
      "[Link](target.md#anchor)",
    );
    const results = await findLinks(tmpDir, { validateLocal: true });
    const link = results.find((r) => r.file === "source.md");
    expect(link).toBeDefined();
    if (link) expect(link.status).toBe("ok");
  });

  it("validateLocal: missing_anchor for absent anchor", async () => {
    await fs.writeFile(path.join(tmpDir, "target.md"), "# anchor");
    await fs.writeFile(
      path.join(tmpDir, "source.md"),
      "[Link](target.md#missing-anchor)",
    );
    const results = await findLinks(tmpDir, { validateLocal: true });
    const link = results.find((r) => r.file === "source.md");
    expect(link).toBeDefined();
    if (link) expect(link.status).toBe("missing_anchor");
  });

  it("validateLocal: #anchor resolves to current file", async () => {
    await fs.writeFile(
      path.join(tmpDir, "self.md"),
      "# intro\n\n[Top](#intro)",
    );
    const results = await findLinks(tmpDir, { validateLocal: true });
    const link = results.find((r) => r.target === "#intro");
    expect(link).toBeDefined();
    if (link) expect(link.status).toBe("ok");
  });

  it("shorthand reference [text][] resolves via text as key", async () => {
    await fs.writeFile(
      path.join(tmpDir, "ref.md"),
      "[install][]\n\n[install]: ./install.md",
    );
    const results = await findLinks(tmpDir);
    const link = results[0];
    expect(link).toBeDefined();
    if (link) {
      expect(link.kind).toBe("reference");
      expect(link.target).toBe("./install.md");
    }
  });

  it("does not return reference definition lines as link records", async () => {
    await fs.writeFile(
      path.join(tmpDir, "defs.md"),
      "[install]: ./install.md\n[API](./api.md)",
    );
    const results = await findLinks(tmpDir);
    // Only the inline link should be returned, not the definition line
    expect(results).toHaveLength(1);
    const link = results[0];
    expect(link).toBeDefined();
    if (link) expect(link.kind).toBe("link");
  });

  it("scans nested directories recursively", async () => {
    const subDir = path.join(tmpDir, "guides");
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, "intro.md"), "[Home](../README.md)");
    const results = await findLinks(tmpDir);
    expect(
      results.some((r) => r.file === path.join("guides", "intro.md")),
    ).toBe(true);
  });

  it("skips unreadable files without aborting", async () => {
    const subDir = path.join(tmpDir, "sub");
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, "good.md"), "[Link](page.md)");
    // Write a file then make it unreadable
    const badFile = path.join(tmpDir, "bad.md");
    await fs.writeFile(badFile, "[X](y.md)");
    await fs.chmod(badFile, 0o000);
    try {
      const results = await findLinks(tmpDir);
      // Should return results from the readable file at minimum
      expect(Array.isArray(results)).toBe(true);
    } finally {
      await fs.chmod(badFile, 0o644);
    }
  });
});
