# stash

Save web pages as plain markdown files you can search, read, and keep forever.

`stash <url>` fetches a page, extracts the main content, and writes a markdown file with YAML frontmatter. There is no hosted service, database, browser extension, or account.

## Requirements

- Node.js 20+
- `npm`/`npx`
- Optional: [qmd](https://github.com/tobi/qmd) for better search ranking

`stash` uses [defuddle](https://github.com/kepano/defuddle) under the hood to extract article content. You do not need to install it separately; `npx` will fetch it automatically the first time you save a page.

## Install

```bash
npm install -g @mpuig/stash
```

Or run without installing:

```bash
npx @mpuig/stash <url>
```

## Quick start

```bash
stash https://example.com/article          # save a page
stash https://example.com/article -t "ai"  # save with tags
stash ls                                    # list saved pages
stash search "agents"                       # search content
stash search "agents" --open                # search and open best match
stash config                                # show config
```

## Commands

### Save a page

```bash
stash <url>
stash <url> -t "ai,tools"
```

### List saved pages

```bash
stash ls
stash ls --tag ai
stash ls -n 5
```

### Search

```bash
stash search "programmatic tool calling"
stash s "agents"
stash search "agents" --open    # open best match in browser
```

### Configuration

```bash
stash config                               # show current config
stash config set dir ~/Documents/stash     # change save directory
stash config set tags "reading,web"        # set default tags
```

### Override directory for one command

`--dir` works on every command:

```bash
stash --dir ~/work https://example.com/article
stash --dir ~/work ls
stash --dir ~/work search "agents"
```

Or set `STASH_DIR` for the same effect:

```bash
STASH_DIR=~/work stash ls
```

## Better search with qmd

`stash search` works out of the box with built-in term matching. If you install [qmd](https://github.com/tobi/qmd), search uses BM25 ranking automatically.

One-time setup — point the collection at your stash directory:

```bash
qmd collection add /path/to/your/stash --name stash --mask "*.md"
```

Replace the path with whatever `stash config` shows as your stash dir.

New stashes are auto-indexed after saving.

If you change your stash directory later, recreate the collection:

```bash
qmd collection remove stash
qmd collection add ~/new/path --name stash --mask "*.md"
```

## What gets saved

Each stash is a markdown file with Obsidian-compatible YAML frontmatter:

```markdown
---
url: "https://example.com/article"
title: "The Article Title"
summary: "A concise description for humans and agents"
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

Files are named `YYYY-MM-DD-slugified-title.md`.

## Configuration

Config lives at `~/.stash/config.json`. Created automatically when you run `stash config set`.

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
| `env` | Extra environment variables to load | `{}` |

Precedence: `--dir` flag > `STASH_DIR` env > config file > defaults.

## Agent integration

Run `stash --help` for a concise overview with examples. No plugin or skill installation needed.

## Why plain markdown?

- No lock-in
- Searchable with `stash`, `grep`, `rg`, `qmd`, or any editor
- Easy to back up and version with git
- Works offline
- Portable to Obsidian, Notion, or anywhere else

## License

MIT
