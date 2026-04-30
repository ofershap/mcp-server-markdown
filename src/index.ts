import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { z } from "zod";
import {
  listMarkdownFiles,
  searchDocs,
  getSection,
  listHeadings,
  findCodeBlocks,
  getFrontmatter,
} from "./markdown.js";

const server = new McpServer({
  name: "mcp-server-markdown",
  version: "1.0.0",
});

server.tool(
  "list_files",
  "List all .md files in a directory recursively. Returns relative paths sorted alphabetically.",
  {
    directory: z
      .string()
      .describe("Path to the directory to scan (e.g. ./docs)"),
  },
  async ({ directory }) => {
    const absDir = path.resolve(directory);
    const files = await listMarkdownFiles(absDir);
    const text =
      files.length > 0 ? files.join("\n") : "(no markdown files found)";
    return { content: [{ type: "text" as const, text }] };
  },
);

server.tool(
  "search_docs",
  "Full-text search across all .md files in a directory. Returns file, line number, and matching line. Limited to 50 results.",
  {
    directory: z
      .string()
      .describe("Path to the directory to search (e.g. ./docs)"),
    query: z.string().describe("Search string (case-insensitive)"),
  },
  async ({ directory, query }) => {
    const absDir = path.resolve(directory);
    const results = await searchDocs(absDir, query);
    const lines = results.map((r) => `${r.file}:${r.line} ${r.content}`);
    const text = lines.length > 0 ? lines.join("\n") : "(no matches)";
    return { content: [{ type: "text" as const, text }] };
  },
);

server.tool(
  "get_section",
  "Extract a section by heading from a markdown file. Returns content from that heading until the next heading of same or higher level.",
  {
    file: z.string().describe("Path to the markdown file"),
    heading: z.string().describe("Heading text to find (case-insensitive)"),
  },
  async ({ file, heading }) => {
    const absPath = path.resolve(file);
    const content = await getSection(absPath, heading);
    const text = content || `(heading "${heading}" not found)`;
    return { content: [{ type: "text" as const, text }] };
  },
);

server.tool(
  "list_headings",
  "List all headings (# through ######) in a markdown file as a table of contents.",
  {
    file: z.string().describe("Path to the markdown file"),
  },
  async ({ file }) => {
    const absPath = path.resolve(file);
    const headings = await listHeadings(absPath);
    const lines = headings.map(
      (h) => `${"  ".repeat(h.level - 1)}- ${h.text} (L${h.line})`,
    );
    const text = lines.length > 0 ? lines.join("\n") : "(no headings found)";
    return { content: [{ type: "text" as const, text }] };
  },
);

server.tool(
  "find_code_blocks",
  "Find all fenced code blocks in a markdown file. Optionally filter by language (e.g. typescript, python).",
  {
    file: z.string().describe("Path to the markdown file"),
    language: z
      .string()
      .optional()
      .describe("Optional: filter by language (e.g. typescript, python)"),
  },
  async ({ file, language }) => {
    const absPath = path.resolve(file);
    const blocks = await findCodeBlocks(absPath, language);
    const parts = blocks.map((b) => {
      const lang = b.language || "(no lang)";
      return `--- ${lang} (L${b.line}) ---\n${b.code}`;
    });
    const text =
      parts.length > 0 ? parts.join("\n\n") : "(no code blocks found)";
    return { content: [{ type: "text" as const, text }] };
  },
);

server.tool(
  "get_frontmatter",
  "Parse YAML frontmatter (between --- delimiters) at the start of a markdown file. Returns key-value metadata.",
  {
    file: z.string().describe("Path to the markdown file"),
  },
  async ({ file }) => {
    const absPath = path.resolve(file);
    const frontmatter = await getFrontmatter(absPath);
    if (!frontmatter) {
      return {
        content: [{ type: "text" as const, text: "(no frontmatter)" }],
      };
    }
    const lines = Object.entries(frontmatter).map(([k, v]) => `${k}: ${v}`);
    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
