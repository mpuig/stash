import { Command } from "commander";
import { stashUrl } from "./commands/save.js";
import { listStashes } from "./commands/list.js";
import { searchStashes } from "./commands/search.js";
import { showConfig, setConfig } from "./commands/config.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

const program = new Command();

program
  .name("stash")
  .description("Save interesting content from the web as searchable markdown")
  .version("0.1.0")
  .option("-d, --dir <path>", "stash directory", config.dir)
  .addHelpText("after", `
Examples:
  stash https://example.com/article
  stash https://example.com/article -t "ai,tools"
  stash ls
  stash search "agents" --open
  stash config set dir ~/Documents/stash

`);

program
  .command("save", { isDefault: true, hidden: true })
  .argument("<url>", "URL to stash")
  .option("-t, --tags <tags>", "comma-separated tags")
  .action(async (url, opts) => {
    const dir = program.opts().dir;
    await stashUrl(url, { ...opts, dir, config });
  });

program
  .command("ls")
  .alias("list")
  .description("List saved stashes")
  .option("-n, --limit <n>", "number of items to show", "20")
  .option("--tag <tag>", "filter by tag")
  .action(async (opts) => {
    const dir = program.opts().dir;
    await listStashes({ ...opts, dir });
  });

program
  .command("search <query>")
  .alias("s")
  .description("Search stashes and optionally open the best match")
  .option("-o, --open", "open the best match URL in the browser")
  .action(async (query, opts) => {
    const dir = program.opts().dir;
    await searchStashes(query, { ...opts, dir });
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
  .command("set <key> <value>")
  .description("Set a config value (e.g., dir ~/Documents/stash)")
  .action((key, value) => {
    setConfig(key, value);
  });

program.parse();
