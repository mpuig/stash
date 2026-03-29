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
  .version("0.1.0");

program
  .argument("[url]", "URL to stash")
  .option("-t, --tags <tags>", "comma-separated tags")
  .option("-d, --dir <path>", "stash directory", config.dir)
  .action(async (url, opts) => {
    if (url) {
      await stashUrl(url, { ...opts, config });
    } else {
      program.help();
    }
  });

program
  .command("list")
  .alias("ls")
  .description("List saved stashes")
  .option("-n, --limit <n>", "number of items to show", "20")
  .option("-t, --tag <tag>", "filter by tag")
  .option("-d, --dir <path>", "stash directory", config.dir)
  .action(async (opts) => {
    await listStashes(opts);
  });

program
  .command("search <query>")
  .alias("s")
  .description("Full-text search across stashes")
  .option("-d, --dir <path>", "stash directory", config.dir)
  .action(async (query, opts) => {
    await searchStashes(query, opts);
  });

program
  .command("open <query>")
  .description("Open the original URL of a matching stash")
  .option("-d, --dir <path>", "stash directory", config.dir)
  .action(async (query, opts) => {
    await openStash(query, opts);
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
