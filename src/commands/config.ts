import { writeFileSync, existsSync } from "node:fs";
import { loadConfig, getConfigPath, getConfigDir } from "../config.js";

export function showConfig(): void {
  const config = loadConfig();
  const configPath = getConfigPath();
  const hasFile = existsSync(configPath);

  console.log(`Config: ${configPath}${hasFile ? "" : " (not created yet)"}`);
  console.log(`Stash dir: ${config.dir}`);
  console.log(`Default tags: ${config.tags.length ? config.tags.join(", ") : "(none)"}`);
  console.log(`Summary mode: ${config.summary.mode}${config.summary.model ? ` (${config.summary.model})` : ""}`);
}

export function initConfig(): void {
  const configPath = getConfigPath();

  if (existsSync(configPath)) {
    console.log(`Config already exists: ${configPath}`);
    showConfig();
    return;
  }

  const defaultConfig = {
    dir: "~/stash",
    tags: [],
    summary: {
      mode: "extract",
    },
    env: {},
  };

  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + "\n", "utf-8");
  console.log(`Created: ${configPath}`);
  console.log();
  showConfig();
}
