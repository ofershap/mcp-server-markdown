import fs from "node:fs/promises";
import path from "node:path";

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface CodeBlock {
  language: string;
  code: string;
  line: number;
}

export type Frontmatter = Record<string, string>;

async function walkDir(dir: string, baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }
  return files;
}

export async function listMarkdownFiles(directory: string): Promise<string[]> {
  const absDir = path.resolve(directory);
  const stat = await fs.stat(absDir);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${directory}`);
  }
  const files = await walkDir(absDir, absDir);
  return files.sort();
}

export async function searchDocs(
  directory: string,
  query: string,
): Promise<SearchResult[]> {
  const absDir = path.resolve(directory);
  const files = await listMarkdownFiles(absDir);
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  const limit = 50;

  for (const file of files) {
    if (results.length >= limit) break;
    const fullPath = path.join(absDir, file);
    const content = await fs.readFile(fullPath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length && results.length < limit; i++) {
      const line = lines[i];
      if (line !== undefined && line.toLowerCase().includes(lowerQuery)) {
        results.push({ file, line: i + 1, content: line });
      }
    }
  }
  return results;
}

export async function getSection(
  filePath: string,
  heading: string,
): Promise<string> {
  const absPath = path.resolve(filePath);
  const content = await fs.readFile(absPath, "utf-8");
  const lines = content.split("\n");
  const lowerHeading = heading.toLowerCase().trim();
  const headingRe = /^(#{1,6})\s+(.+)$/;
  let targetLevel = 0;
  let startLine = -1;
  let endLine = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line !== undefined ? line.match(headingRe) : null;
    if (match && match[1] !== undefined && match[2] !== undefined) {
      const level = match[1].length;
      const text = match[2].trim().toLowerCase();
      if (text === lowerHeading) {
        targetLevel = level;
        startLine = i;
        break;
      }
    }
  }

  if (startLine < 0) {
    return "";
  }

  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line !== undefined ? line.match(headingRe) : null;
    if (match && match[1] !== undefined) {
      const level = match[1].length;
      if (level <= targetLevel) {
        endLine = i;
        break;
      }
    }
  }

  return lines.slice(startLine, endLine).join("\n").trim();
}

export async function listHeadings(filePath: string): Promise<Heading[]> {
  const absPath = path.resolve(filePath);
  const content = await fs.readFile(absPath, "utf-8");
  const lines = content.split("\n");
  const headings: Heading[] = [];
  const headingRe = /^(#{1,6})\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line !== undefined ? line.match(headingRe) : null;
    if (match && match[1] !== undefined && match[2] !== undefined) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i + 1,
      });
    }
  }
  return headings;
}

export async function findCodeBlocks(
  filePath: string,
  language?: string,
): Promise<CodeBlock[]> {
  const absPath = path.resolve(filePath);
  const content = await fs.readFile(absPath, "utf-8");
  const lines = content.split("\n");
  const blocks: CodeBlock[] = [];
  const fenceRe = /^```(\w*)\s*$/;
  let inBlock = false;
  let blockLang = "";
  let blockStart = 0;
  const blockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const fence = line.match(fenceRe);
    if (fence) {
      if (!inBlock) {
        inBlock = true;
        blockLang = fence[1] ?? "";
        blockStart = i + 1;
        blockLines.length = 0;
      } else {
        inBlock = false;
        if (
          language === undefined ||
          blockLang.toLowerCase() === language.toLowerCase()
        ) {
          blocks.push({
            language: blockLang,
            code: blockLines.join("\n"),
            line: blockStart,
          });
        }
      }
    } else if (inBlock) {
      blockLines.push(line);
    }
  }
  return blocks;
}

export async function getFrontmatter(
  filePath: string,
): Promise<Frontmatter | null> {
  const absPath = path.resolve(filePath);
  const content = await fs.readFile(absPath, "utf-8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match || match[1] === undefined) return null;
  const yaml = match[1];
  const result: Frontmatter = {};
  const keyValueRe = /^([^:#\s]+):\s*(.*)$/m;
  for (const line of yaml.split("\n")) {
    const kv = line.trim().match(keyValueRe);
    const key = kv?.[1];
    const valRaw = kv?.[2];
    if (key !== undefined && valRaw !== undefined) {
      const keyTrim = key.trim();
      let val = valRaw.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[keyTrim] = val;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}
