import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { loadConfig, getConfigPath, getConfigDir } from "../config.js";

export function showConfig(dirOverride?: string): void {
  const config = loadConfig();
  const configPath = getConfigPath();
  const hasFile = existsSync(configPath);
  const activeDir = dirOverride || config.dir;

  console.log(`Config: ${configPath}${hasFile ? "" : " (not created yet)"}`);
  console.log(`Stash dir: ${activeDir}${dirOverride && dirOverride !== config.dir ? " (--dir override)" : ""}`);
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

export function setConfig(key: string, value: string): void {
  const configPath = getConfigPath();

  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, "utf-8"));
  }

  // support dotted keys like summary.mode
  const keys = key.split(".");
  let target: Record<string, unknown> = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof target[keys[i]] !== "object" || target[keys[i]] === null) {
      target[keys[i]] = {};
    }
    target = target[keys[i]] as Record<string, unknown>;
  }

  const finalKey = keys[keys.length - 1];

  // parse arrays for tags
  if (key === "tags") {
    target[finalKey] = value.split(",").map((t) => t.trim());
  } else if (key === "dir") {
    // Collapse absolute home path back to ~ for portability
    const home = homedir();
    target[finalKey] = value.startsWith(home + "/") ? "~" + value.slice(home.length) : value;
  } else {
    target[finalKey] = value;
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  console.log(`Set ${key} = ${value}`);
}
