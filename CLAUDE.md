# Stash

CLI tool that saves web content as searchable markdown files.

## Architecture

- **Language**: TypeScript, ESM, Node.js 20+
- **CLI framework**: Commander.js
- **Content extraction**: Calls `defuddle` CLI as a subprocess via `execFileSync` (not imported as a library — defuddle needs a DOM environment)
- **Search**: qmd BM25 when available, built-in term matching as fallback
- **Storage**: Plain markdown files with Obsidian-compatible YAML frontmatter in a configurable directory (default `~/stash`)
- **Config**: `~/.stash/config.json` — optional, zero-config by default

## Project structure

```
src/
  cli.ts          CLI entry point, Commander setup, LLM usage guide
  config.ts       Config loading, defaults, ~ expansion
  extract.ts      Content extraction via defuddle subprocess
  commands/
    save.ts       stash <url> — fetch, save, auto-index qmd
    list.ts       stash list — list saved stashes
    search.ts     stash search — qmd BM25 or built-in grep
    open.ts       stash open — open original URL
    config.ts     stash config — show/init/set config
scripts/
  build-cli.mjs   Generates dist/cli.js shebang wrapper
```

## Build

```bash
npm install
npm run build     # tsc + generate CLI wrapper
npm run dev       # run via tsx without building
```

The build produces `dist/cli.js` (thin ESM wrapper) and `dist/esm/` (compiled TypeScript). Not bundled — uses tsc output directly to avoid CJS/ESM interop issues.

## Key decisions

- **No bundling**: CLI wrapper does `await import('./esm/cli.js')` — avoids esbuild CJS shim problems.
- **Defuddle as subprocess**: defuddle's `parse()` needs a DOM `Document` object. The CLI handles fetching + DOM setup internally, so we call `execFileSync("npx", ["defuddle", "parse", url, "--json"])` rather than importing the library.
- **No shell interpolation**: All subprocess calls use `execFileSync()` with argv arrays to prevent shell injection. Never use `execSync()` with string interpolation.
- **YAML safety**: All string values in frontmatter are always double-quoted. This prevents crashes on values like `@handles`, URLs with special characters, etc.
- **Obsidian-compatible frontmatter**: Tags as indented YAML lists, dates as YYYY-MM-DD, all strings quoted.
- **No LLM by default**: Summary field uses page description or first paragraph. AI summaries are planned as opt-in (`summary.mode: "ai"` in config).
- **Config follows summarize pattern**: `~/.stash/config.json`, env vars override config, CLI flags override everything.
- **Search with qmd**: Uses qmd BM25 search scoped to the collection matching the stash directory. Falls back to built-in term matching if qmd is not installed. Auto-indexes after each save.
- **Per-file error handling**: list, search, and open skip malformed files gracefully instead of crashing.

## Commands

| Command | Purpose |
|---------|---------|
| `stash <url> [-t tags]` | Fetch, extract, save as markdown, auto-index |
| `stash list [-n limit] [-t tag]` | List saved stashes |
| `stash search <query>` | Full-text search (qmd BM25 or built-in) |
| `stash open <query>` | Open best match URL in browser |
| `stash config` | Show config |
| `stash config init` | Create default config file |
| `stash config set <key> <value>` | Set a config value (supports dotted keys) |

## Testing changes

```bash
npm run dev -- <url>                    # run without building
npm run build && stash <url>            # build + run via global link
```

## Security

- All subprocess calls use `execFileSync()` with argv arrays — no shell interpolation
- All YAML string values are double-quoted to prevent injection via crafted titles/authors
- Malformed stash files are skipped with a warning, never crash the CLI
