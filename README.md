# mcp-server-markdown

[![npm version](https://img.shields.io/npm/v/mcp-server-markdown.svg)](https://www.npmjs.com/package/mcp-server-markdown)
[![npm downloads](https://img.shields.io/npm/dm/mcp-server-markdown.svg)](https://www.npmjs.com/package/mcp-server-markdown)
[![CI](https://github.com/ofershap/mcp-server-markdown/actions/workflows/ci.yml/badge.svg)](https://github.com/ofershap/mcp-server-markdown/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Agent Plugins](https://img.shields.io/badge/Agent_Plugins-1.0.0-0ea5e9.svg)](https://agent-plugins.org)

Search, navigate, and extract content from local markdown files. Full-text search, section extraction, heading navigation, code block discovery, and frontmatter parsing.

```bash
npx mcp-server-markdown
```

> Works with Claude Desktop, Cursor, VS Code Copilot, and any MCP client. Reads local `.md` files, no auth needed.

<p align="center">
  <a href="https://cursor.com/en/install-mcp?name=markdown&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm1jcC1zZXJ2ZXItbWFya2Rvd24iXX0="><img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install in Cursor" height="32" /></a>
  &nbsp;
  <a href="vscode:mcp/install?%7B%22name%22%3A%22markdown%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-server-markdown%22%5D%7D"><img src="https://img.shields.io/badge/Add_to_VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Add to VS Code" /></a>
</p>

![MCP server for searching and navigating markdown documentation](assets/demo.gif)

<sub>Demo built with <a href="https://github.com/ofershap/remotion-readme-kit">remotion-readme-kit</a></sub>

## Why

Tools like Context7 are great for looking up library docs from npm, but they don't help with your own documentation. Project wikis, internal knowledge bases, architecture decision records, onboarding guides: they all live as markdown files in your repo or on disk. The filesystem MCP server can read those files, but it treats them as raw text. It doesn't understand headings, sections, or code blocks. This server does. Point it at a directory and your assistant can search across all your docs, pull out a specific section by heading, list the table of contents, or find every TypeScript code example in your knowledge base.

## Tools

| Tool               | What it does                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `list_files`       | List all .md files in a directory recursively (sorted alphabetically)      |
| `search_docs`      | Full-text search across all .md files (case-insensitive, up to 50 results) |
| `get_section`      | Extract a section by heading until the next heading of same/higher level   |
| `list_headings`    | List all headings as a table of contents                                   |
| `find_code_blocks` | Find fenced code blocks, optionally filter by language (e.g. typescript)   |
| `get_frontmatter`  | Parse YAML frontmatter metadata at the start of a file                     |

## Quick Start

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "markdown": {
      "command": "npx",
      "args": ["-y", "mcp-server-markdown"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "markdown": {
      "command": "npx",
      "args": ["-y", "mcp-server-markdown"]
    }
  }
}
```

### VS Code

Add to user settings or `.vscode/mcp.json`:

```json
{
  "mcp": {
    "servers": {
      "markdown": {
        "command": "npx",
        "args": ["-y", "mcp-server-markdown"]
      }
    }
  }
}
```

## Examples

- "Search all docs in ./docs for mentions of 'authentication'"
- "Show me the 'API Reference' section from README.md"
- "List all headings in CONTRIBUTING.md"
- "Find all TypeScript code blocks in the docs"
- "What's the frontmatter metadata in this file?"
- "Give me the table of contents for our architecture docs"

## Agent Plugins

This repo is an [Agent Plugins](https://agent-plugins.org) 1.0.0 package: `plugin.json`, portable `mcp.json`, and `skills/` ship together with the MCP server.

For Cursor, clone the repo and copy or symlink it to `~/.cursor/plugins/local/mcp-server-markdown`, then reload the window. Skills and MCP show up under Customize > Plugins.

The Cursor and VS Code install buttons above still work: they add the same `npx -y mcp-server-markdown` stdio server as manual JSON.

## FAQ

### What is mcp-server-markdown?

An MCP server that searches and navigates local `.md` files: full-text search, sections by heading, TOC, code blocks, and YAML frontmatter.

### How is this different from Context7?

Context7 pulls published library docs from npm. This server indexes markdown already on your disk (wikis, ADRs, internal guides).

### How is this different from the filesystem MCP?

Filesystem tools read raw files. This server understands headings, sections, fenced code, and frontmatter.

### Can I install it as an Agent Plugin in Cursor?

Yes. Use `~/.cursor/plugins/local/mcp-server-markdown` so the bundled `markdown-search` skill loads with the MCP config.

### Do I need API keys?

No. Paths are local; the agent passes directory and file paths to the tools.

## Development

```bash
git clone https://github.com/ofershap/mcp-server-markdown.git
cd mcp-server-markdown
npm install
npm test
npm run build
```

## See also

More MCP servers and developer tools on my [portfolio](https://gitshow.dev/ofershap).

## Author

[![Made by ofershap](https://gitshow.dev/api/card/ofershap)](https://gitshow.dev/ofershap)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/ofershap)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github&logoColor=white)](https://github.com/ofershap)

---

<sub>README built with [README Builder](https://ofershap.github.io/readme-builder/)</sub>

## License

MIT © 2026 Ofer Shapira
