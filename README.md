# stash

Save interesting content from the web as searchable markdown files.

`stash <url>` fetches a page, extracts the main content, and saves it as a markdown file with metadata. No account, no API key, no database — just plain files you own.

## Install

```bash
npm install -g @mpuig/stash
```

Or run directly:

```bash
npx @mpuig/stash <url>
```

Requires Node.js 20+ and [defuddle](https://github.com/kepano/defuddle) (installed automatically via npx).

## Usage

```bash
# Save a page
stash https://example.com/interesting-article

# Save with tags
stash https://example.com/article -t "ai,tools"

# List saved stashes
stash list
stash ls

# Search across all stashes
stash search "programmatic tool calling"
stash s "agents"

# Open the original URL in your browser
stash open "mythical agent"

# Show current configuration
stash config

# Create a config file
stash config init

# Change where stashes are saved
stash config set dir ~/Documents/stash

# Set default tags for all stashes
stash config set tags "reading,web"
```

## How it works

1. Fetches the URL
2. Extracts the main content using [defuddle](https://github.com/kepano/defuddle) (no AI, pure HTML parsing)
3. Saves a markdown file to `~/stash/` with YAML frontmatter

Each file looks like:

```markdown
---
url: "https://example.com/article"
title: The Article Title
summary: A concise description of the content for humans and agents
author: Jane Doe
domain: example.com
published: "2026-03-01T00:00:00.000Z"
saved: 2026-03-29
tags: ["ai", "tools"]
wordCount: 1500
---

Full article content in markdown...
```

## Configuration

Config lives at `~/.stash/config.json`. Create it with `stash config init`, or set values directly with `stash config set`.

```json
{
  "dir": "~/stash",
  "tags": [],
  "summary": {
    "mode": "extract"
  },
  "env": {}
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `dir` | Where markdown files are saved | `~/stash` |
| `tags` | Default tags applied to every stash | `[]` |
| `summary.mode` | `"extract"` (from page) or `"ai"` (LLM-generated) | `"extract"` |
| `summary.model` | LLM model for AI summaries (when mode is `"ai"`) | — |
| `env` | Environment variables (e.g., API keys for future AI features) | `{}` |

Resolution order: CLI flags > environment variables > config file > defaults.

## Search

`stash search` does simple full-text search across all frontmatter and content. For more powerful search, point [qmd](https://github.com/tobi/qmd) at your stash directory:

```bash
qmd ~/stash "tool calling agents"
```

## Why plain markdown?

- No app dependency or lock-in
- Searchable with grep, ripgrep, qmd, or any tool
- Readable as-is in any editor
- Easy to version with git
- Works offline forever
- Portable to Obsidian, Notion, or anywhere else

## License

MIT
