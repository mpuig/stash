# stash

Save web pages as plain markdown files you can search, read, and keep forever.

`stash <url>` fetches a page, extracts the main content, and writes a markdown file with YAML frontmatter. There is no hosted service, database, browser extension, or account.

## Requirements

- Node.js 20+
- `npm`/`npx`
- Optional: [qmd](https://github.com/tobi/qmd) for better search ranking

`stash` uses [defuddle](https://github.com/kepano/defuddle) under the hood to extract article content. You do not need to install it separately; `npx` will fetch it automatically the first time you save a page.

## Install

Install globally:

```bash
npm install -g @mpuig/stash
```

Or run it without installing:

```bash
npx @mpuig/stash <url>
```

## Quick Start

### 1. Check your current config

```bash
stash config
```

By default, stashes are saved to `~/stash`.

### 2. Optional: create a config file

If you want an explicit config file to edit later:

```bash
stash config init
```

This creates `~/.stash/config.json`.

### 3. Optional: change the save directory

```bash
stash config set dir ~/Documents/stash
```

After changing the directory, new stashes will be saved there by default.

### 4. Save your first page

```bash
stash https://example.com/interesting-article
```

Add tags if you want:

```bash
stash https://example.com/article -t "ai,tools"
```

### 5. Browse what you saved

```bash
stash list
stash search "tool calling"
stash open "interesting article"
```

## Everyday Usage

### Save a page

```bash
stash https://example.com/article
stash https://example.com/article -t "reading,cli"
```

### List saved pages

```bash
stash list
stash ls
stash list --tag ai
stash list -n 5
```

### Search saved pages

```bash
stash search "programmatic tool calling"
stash s "agents"
```

### Open the original URL in your browser

```bash
stash open "mythical agent"
```

### Show or change config

```bash
stash config
stash config init
stash config set dir ~/Documents/stash
stash config set tags "reading,web"
```

## Using Another Directory

There are two ways to work with a non-default stash directory:

Use it as your default:

```bash
stash config set dir ~/Documents/stash
```

Or use it for one command by setting `STASH_DIR`:

```bash
STASH_DIR=~/Documents/stash stash https://example.com/article
```

For `list`, `search`, and `open`, you can also pass `--dir` directly:

```bash
stash list --dir ~/Documents/stash
stash search "agents" --dir ~/Documents/stash
stash open "mythical agent" --dir ~/Documents/stash
```

## Optional: Better Search With qmd

`stash search` works out of the box with built-in term matching. If you install [qmd](https://github.com/tobi/qmd), `stash` can use BM25-ranked search for your configured default stash directory.

One-time setup:

```bash
qmd collection add ~/stash --name stash --mask "*.md"
```

If your stash directory is not `~/stash`, use that directory instead:

```bash
qmd collection add ~/Documents/stash --name stash --mask "*.md"
```

After that, new stashes are indexed automatically when you save them.

If you use `search --dir ...` to search another folder, `stash` falls back to its built-in search for that command.

## What Gets Saved

Each stash is a markdown file with Obsidian-compatible YAML frontmatter:

```markdown
---
url: "https://example.com/article"
title: "The Article Title"
summary: "A concise description of the content for humans and agents"
author: "Jane Doe"
domain: "example.com"
published: "2026-03-01"
saved: "2026-03-29"
tags:
  - "ai"
  - "tools"
wordCount: 1500
---

Full article content in markdown...
```

Files are named like `YYYY-MM-DD-slugified-title.md`.

## Configuration

Config lives at `~/.stash/config.json`.

Example:

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
| `dir` | Directory where markdown files are saved | `~/stash` |
| `tags` | Default tags added to every new stash | `[]` |
| `summary.mode` | Reserved for future summary modes | `"extract"` |
| `summary.model` | Reserved for future AI summaries | — |
| `env` | Extra environment variables to load into the process | `{}` |

Current precedence:

1. `STASH_DIR` environment variable
2. Config file
3. Built-in defaults

For `list`, `search`, and `open`, `--dir` overrides the configured directory for that command.

## Troubleshooting

### `No stashes yet`

You have not saved anything in the current stash directory yet. Run:

```bash
stash https://example.com/article
```

Or check which directory is active:

```bash
stash config
```

### Search is not using qmd

Make sure:

- `qmd` is installed
- you created a collection named `stash`
- the collection points to your configured stash directory

### I want the built-in help for agents or scripts

Run:

```bash
stash --help
```

It includes examples, file format details, and usage notes for programmatic use.

## Why plain markdown?

- No lock-in
- Searchable with `stash`, `grep`, `rg`, `qmd`, or any editor
- Easy to back up and version with git
- Works offline
- Portable to Obsidian, Notion, or anywhere else

## License

MIT
