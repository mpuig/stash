import { Command } from "commander";
import { stashUrl } from "./commands/save.js";
import { listStashes } from "./commands/list.js";
import { searchStashes } from "./commands/search.js";
import { openStash } from "./commands/open.js";
import { showConfig, initConfig, setConfig } from "./commands/config.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

const program = new Command();

program
  .name("stash")
  .description("Save interesting content from the web as searchable markdown")
  .version("0.1.0")
  .addHelpText("after", `
LLM USAGE GUIDE:

  stash is a CLI tool that saves web pages as searchable markdown files.
  Each saved file contains YAML frontmatter (url, title, summary, author,
  domain, published, saved, tags, wordCount) followed by the full article
  content in markdown.

  Files are stored in a configurable directory (default: ~/stash).
  Config is at ~/.stash/config.json.

  Save a URL:
    stash "https://example.com/article"
    stash "https://example.com/article" -t "ai,tools"

  Search saved content:
    stash search "tool calling"
    stash s "agents"

  List saved stashes:
    stash list
    stash ls
    stash list -t ai              # filter by tag
    stash list -n 5               # limit results

  Open original URL in browser:
    stash open "mythical agent"

  Configuration:
    stash config                          # show current config
    stash config init                     # create default config file
    stash config set dir ~/docs/stash     # change stash directory
    stash config set tags "reading,web"   # set default tags

  File format (Obsidian-compatible YAML frontmatter):
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

  All string values are always double-quoted for YAML safety.
  Tags use Obsidian-compatible indented list format.
  Published dates are YYYY-MM-DD.

  Reading stash files programmatically:
    Files are plain markdown with YAML frontmatter. Parse frontmatter to
    get metadata, read the body for full content. Filenames follow the
    pattern: YYYY-MM-DD-slugified-title.md

  Search:
    When qmd is installed with a "stash" collection, search uses BM25
    ranking via qmd. Otherwise it falls back to built-in term matching.
    Set up qmd (one-time): qmd collection add ~/stash --name stash --mask "*.md"
    New stashes are auto-indexed in qmd after saving.

  Tips:
    - Use tags to categorize content for later retrieval.
    - The summary field is always present — use it for quick scanning.
    - Combine with grep/ripgrep/qmd for powerful full-text search.
    - All data is local plain files — no API keys or accounts needed.
    - Stash directory can be version-controlled with git.
    - Malformed stash files are skipped gracefully in list/search/open.
`);

function resolveDir(opts: { dir?: string }): string {
  return opts.dir || config.dir;
}

const saveCmd = program
  .command("save", { isDefault: true })
  .argument("<url>", "URL to stash")
  .option("-t, --tags <tags>", "comma-separated tags")
  .option("-d, --dir <path>", `stash directory (default: ${config.dir})`)
  .action(async (url, opts) => {
    await stashUrl(url, { ...opts, dir: resolveDir(opts), config });
  });

program
  .command("list")
  .alias("ls")
  .description("List saved stashes")
  .option("-n, --limit <n>", "number of items to show", "20")
  .option("--tag <tag>", "filter by tag")
  .option("-d, --dir <path>", `stash directory (default: ${config.dir})`)
  .action(async (opts) => {
    await listStashes({ ...opts, dir: resolveDir(opts) });
  });

program
  .command("search <query>")
  .alias("s")
  .description("Full-text search across stashes")
  .option("-d, --dir <path>", `stash directory (default: ${config.dir})`)
  .action(async (query, opts) => {
    await searchStashes(query, { ...opts, dir: resolveDir(opts) });
  });

program
  .command("open <query>")
  .description("Open the original URL of a matching stash")
  .option("-d, --dir <path>", `stash directory (default: ${config.dir})`)
  .action(async (query, opts) => {
    await openStash(query, { ...opts, dir: resolveDir(opts) });
  });

const configCmd = program
  .command("config")
  .description("Show or manage configuration");

configCmd
  .command("show", { isDefault: true })
  .description("Show current configuration")
  .action(() => {
    showConfig();
  });

configCmd
  .command("init")
  .description("Create a default config file")
  .action(() => {
    initConfig();
  });

configCmd
  .command("set <key> <value>")
  .description("Set a config value (e.g., dir ~/Documents/stash)")
  .action((key, value) => {
    setConfig(key, value);
  });

program.parse();
