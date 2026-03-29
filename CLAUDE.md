# Stash

CLI tool that saves web content as searchable markdown files.

## Architecture

- **Language**: TypeScript, ESM, Node.js 20+
- **CLI framework**: Commander.js
- **Content extraction**: Calls `defuddle` CLI as a subprocess (not imported as a library — defuddle needs a DOM environment)
- **Storage**: Plain markdown files with YAML frontmatter in a configurable directory (default `~/stash`)
- **Config**: `~/.stash/config.json` — optional, zero-config by default

## Project structure

```
src/
  cli.ts          CLI entry point, Commander setup
  config.ts       Config loading and defaults
  extract.ts      Content extraction via defuddle subprocess
  commands/
    save.ts       stash <url> — fetch and save
    list.ts       stash list — list saved stashes
    search.ts     stash search — full-text search
    open.ts       stash open — open original URL
    config.ts     stash config — show/init config
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
- **Defuddle as subprocess**: defuddle's `parse()` needs a DOM `Document` object. The CLI handles fetching + DOM setup internally, so we shell out to `npx defuddle parse <url> --json` rather than importing the library.
- **No LLM by default**: Summary field uses page description or first paragraph. AI summaries are planned as opt-in (`summary.mode: "ai"` in config).
- **Config follows summarize pattern**: `~/.stash/config.json`, env vars override config, CLI flags override everything.

## Commands

| Command | Purpose |
|---------|---------|
| `stash <url> [-t tags]` | Fetch, extract, save as markdown |
| `stash list [-n limit] [-t tag]` | List saved stashes |
| `stash search <query>` | Full-text search |
| `stash open <query>` | Open best match URL in browser |
| `stash config` | Show config |
| `stash config init` | Create default config file |
| `stash config set <key> <value>` | Set a config value (supports dotted keys) |

## Testing changes

```bash
npm run dev -- <url>                    # run without building
npm run build && stash <url>            # build + run via global link
```
