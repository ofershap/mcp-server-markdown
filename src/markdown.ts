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

export interface LinkRecord {
  file: string;
  line: number;
  column: number;
  kind: "link" | "image" | "reference";
  text: string;
  target: string;
  status: "ok" | "missing_file" | "missing_anchor" | "external" | "skipped";
}

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

function isExternalUrl(target: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(target);
}

function headingToAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function getAnchorsFromFile(absFilePath: string): Promise<Set<string>> {
  try {
    const content = await fs.readFile(absFilePath, "utf-8");
    const lines = content.split("\n");
    const anchors = new Set<string>();
    const headingRe = /^(#{1,6})\s+(.+)$/;
    for (const line of lines) {
      const match = line.match(headingRe);
      if (match && match[2] !== undefined) {
        anchors.add(headingToAnchor(match[2].trim()));
      }
    }
    return anchors;
  } catch {
    return new Set();
  }
}

async function validateLocalTarget(
  target: string,
  absSourceFile: string,
): Promise<"ok" | "missing_file" | "missing_anchor"> {
  const hashIdx = target.indexOf("#");
  const filePart = hashIdx >= 0 ? target.slice(0, hashIdx) : target;
  const anchor = hashIdx >= 0 ? target.slice(hashIdx + 1) : undefined;

  const absTarget = filePart
    ? path.resolve(path.dirname(absSourceFile), filePart)
    : absSourceFile;

  try {
    await fs.stat(absTarget);
  } catch {
    return "missing_file";
  }

  if (anchor !== undefined && anchor !== "" && absTarget.endsWith(".md")) {
    const anchors = await getAnchorsFromFile(absTarget);
    if (!anchors.has(anchor)) {
      return "missing_anchor";
    }
  }

  return "ok";
}

export async function findLinks(
  directory: string,
  options?: {
    validateLocal?: boolean;
    includeImages?: boolean;
    includeExternal?: boolean;
  },
): Promise<LinkRecord[]> {
  const absDir = path.resolve(directory);
  const stat = await fs.stat(absDir);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${directory}`);
  }

  const validateLocal = options?.validateLocal ?? false;
  const includeImages = options?.includeImages ?? true;
  const includeExternal = options?.includeExternal ?? true;

  const relFiles = await listMarkdownFiles(absDir);
  const results: LinkRecord[] = [];

  const refDefRe = /^\s*\[([^\]]+)\]:\s*(.+)/;
  const linkRe = /(!?)\[([^\]]*)\](?:\(([^)]*)\)|\[([^\]]*)\])/g;

  for (const relFile of relFiles) {
    const absFile = path.join(absDir, relFile);
    try {
      const content = await fs.readFile(absFile, "utf-8");
      const lines = content.split("\n");

      // Pass 1: collect reference definitions
      const refs = new Map<string, string>();
      for (const line of lines) {
        const m = line.match(refDefRe);
        if (m && m[1] !== undefined && m[2] !== undefined) {
          refs.set(m[1].trim().toLowerCase(), m[2].trim());
        }
      }

      // Pass 2: extract link records line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;

        for (const match of line.matchAll(linkRe)) {
          const bang = match[1] ?? "";
          const text = match[2] ?? "";
          const inlineUrl = match[3];
          const refKey = match[4];
          const isImage = bang === "!";
          const column = (match.index ?? 0) + 1;

          let target: string;
          let kind: "link" | "image" | "reference";

          if (inlineUrl !== undefined) {
            target = inlineUrl;
            kind = isImage ? "image" : "link";
          } else if (refKey !== undefined) {
            const key =
              refKey.trim() === ""
                ? text.trim().toLowerCase()
                : refKey.trim().toLowerCase();
            const resolved = refs.get(key);
            if (resolved === undefined) continue;
            target = resolved;
            kind = isImage ? "image" : "reference";
          } else {
            continue;
          }

          if (!includeImages && isImage) continue;

          let status: LinkRecord["status"];
          if (isExternalUrl(target)) {
            if (!includeExternal) continue;
            status = "external";
          } else {
            if (validateLocal) {
              status = await validateLocalTarget(target, absFile);
            } else {
              status = "skipped";
            }
          }

          results.push({
            file: relFile,
            line: i + 1,
            column,
            kind,
            text,
            target,
            status,
          });
        }
      }
    } catch {
      // skip unreadable files — one bad file must not abort the scan
    }
  }

  return results;
}
