#!/usr/bin/env node
// GitHub Copilot CLI permissionRequest hook
// Reads JSON payload from stdin, allows/denies bash/shell tool calls

const fs = require("fs");

let raw = "";
try {
  raw = fs.readFileSync(0, "utf8") || "{}";
} catch {
  raw = "{}";
}

// Debug: write raw input to file for inspection
try {
  fs.writeFileSync("/tmp/hook-debug.json", raw);
} catch {}

let input = {};
try {
  input = JSON.parse(raw);
} catch {
  // Can't parse input — fall through to normal permission flow
  process.exit(0);
}

const tool = input.toolName ?? input.tool_name ?? "";
if (tool !== "bash" && tool !== "shell") {
  // Not a shell tool — fall through
  process.exit(0);
}

// toolInput may be a JSON string (real CLI format) or an object
let argsRaw = input.toolInput ?? input.toolArgs ?? input.tool_input ?? input.arguments ?? {};
let args = {};
try {
  args = typeof argsRaw === "string" ? JSON.parse(argsRaw) : argsRaw;
} catch {
  args = {};
}

const cmd = String(args.command ?? args.input ?? "").trim();

// Empty command — fall through to normal permission flow
if (!cmd) {
  process.exit(0);
}

// Deny dangerous patterns regardless of allowlist
const deny = [
  /\brm\s+-rf\b/,
  /\bcurl\b.*\|\s*(?:bash|sh)\b/,
  /\bwget\b.*\|\s*(?:bash|sh)\b/,
  /\bmkfs\b/,
  /\bdd\b.*\bof=/,
];

if (deny.some((r) => r.test(cmd))) {
  console.log(
    JSON.stringify({
      behavior: "deny",
      message: "Denied by hook policy: dangerous command pattern.",
    }),
  );
  process.exit(0);
}

// Allow commands safe for /solve workflow
const allow = [
  /^(?:node|npm|pnpm|npx)\b/,
  /^(?:openspec)\b/,
  /^(?:git(?:\s+--no-pager)?\s+(?:status|diff|log|show|rev-parse|branch|ls-files|stash))\b/,
  /^(?:ls|pwd|cat|head|tail|find|rg|cd)\b/,
  /^(?:echo|which|type|mkdir|cp|mv|touch)\b/,
];

// Split compound commands (&&, ;) and check each segment
const segments = cmd
  .split(/&&|;/)
  .map((s) => s.trim())
  .filter(Boolean);

const allAllowed = segments.every((seg) => allow.some((r) => r.test(seg)));

if (allAllowed) {
  console.log(JSON.stringify({ behavior: "allow" }));
  process.exit(0);
}

// Not in allowlist — fall through to normal permission flow (shows prompt)
process.exit(0);
