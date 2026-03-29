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
  cli.ts          CLI entry point, Commander setup
  config.ts       Config loading, defaults, ~ expansion
  extract.ts      Content extraction via defuddle subprocess
  util.ts         Shared helpers (assertDirExists)
  commands/
    save.ts       stash <url> — fetch, save, auto-index qmd
    list.ts       stash ls — list saved stashes
    search.ts     stash search — qmd BM25 or built-in grep, --open support
    config.ts     stash config — show/set config
scripts/
  build-cli.mjs   Generates dist/cli.js shebang wrapper
```

## Commands

| Command | Purpose |
|---------|---------|
| `stash <url> [-t tags]` | Fetch, extract, save as markdown, auto-index |
| `stash ls [--tag tag] [-n limit]` | List saved stashes |
| `stash search <query> [--open]` | Search stashes; `--open` opens best match in browser |
| `stash config` | Show config |
| `stash config set <key> <value>` | Set a config value (supports dotted keys) |

`--dir` is a global option that works on every command.

## Build

```bash
npm install
npm run build     # tsc + generate CLI wrapper
npm run dev       # run via tsx without building
```

## Key decisions

- **No bundling**: CLI wrapper does `await import('./esm/cli.js')`.
- **Defuddle as subprocess**: `execFileSync("npx", ["defuddle", "parse", url, "--json"])`.
- **No shell interpolation**: All subprocess calls use `execFileSync()` with argv arrays.
- **YAML safety**: All string values in frontmatter are always double-quoted.
- **Obsidian-compatible frontmatter**: Tags as indented YAML lists, dates as YYYY-MM-DD.
- **Global `--dir`**: Defined once on the root program, read via `program.opts().dir` in all subcommands.
- **Search + open merged**: `stash search "foo" --open` replaces the old separate `open` command.
- **qmd verification**: Checks that the qmd collection's indexed files exist in the target directory before using it.
- **Per-file error handling**: list and search skip malformed files gracefully.

## Security

- All subprocess calls use `execFileSync()` with argv arrays — no shell interpolation
- All YAML string values are double-quoted to prevent injection via crafted titles/authors
- Malformed stash files are skipped with a warning, never crash the CLI
- Directory existence checked before filesystem operations

## Testing changes

```bash
npm run dev -- <url>                    # run without building
npm run build && stash <url>            # build + run via global link
```
