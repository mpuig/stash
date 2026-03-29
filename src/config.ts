import { join } from "node:path";
import { homedir } from "node:os";
import { mkdirSync, readFileSync, existsSync } from "node:fs";

export interface StashConfig {
  dir: string;
  tags: string[];
  summary: {
    mode: "extract" | "ai";
    model?: string;
  };
  env: Record<string, string>;
}

const STASH_HOME = join(homedir(), ".stash");
const CONFIG_PATH = join(STASH_HOME, "config.json");

const DEFAULTS: StashConfig = {
  dir: join(homedir(), "stash"),
  tags: [],
  summary: {
    mode: "extract",
  },
  env: {},
};

let _config: StashConfig | null = null;

export function getConfigDir(): string {
  return STASH_HOME;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): StashConfig {
  if (_config) return _config;

  mkdirSync(STASH_HOME, { recursive: true });

  let fileConfig: Partial<StashConfig> = {};

  if (existsSync(CONFIG_PATH)) {
    try {
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      fileConfig = JSON.parse(raw);
    } catch (err) {
      console.error(`Warning: could not parse ${CONFIG_PATH}: ${(err as Error).message}`);
    }
  }

  // expand ~ in paths
  const expandHome = (p: string) => p.startsWith("~/") ? join(homedir(), p.slice(2)) : p;

  // env vars override config file
  const dir = expandHome(process.env.STASH_DIR || fileConfig.dir || DEFAULTS.dir);

  // merge env from config into process.env (config file values don't override existing env)
  const envFromConfig = { ...DEFAULTS.env, ...fileConfig.env };
  for (const [key, value] of Object.entries(envFromConfig)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  _config = {
    dir,
    tags: fileConfig.tags || DEFAULTS.tags,
    summary: {
      mode: fileConfig.summary?.mode || DEFAULTS.summary.mode,
      model: fileConfig.summary?.model || DEFAULTS.summary.model,
    },
    env: envFromConfig,
  };

  mkdirSync(_config.dir, { recursive: true });

  return _config;
}

export function getStashDir(): string {
  return loadConfig().dir;
}
