import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { loadConfig } from "../config.js";

interface SearchOptions {
  dir: string;
}

function hasQmd(): boolean {
  try {
    execFileSync("which", ["qmd"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function qmdCollectionExists(name: string): boolean {
  try {
    const output = execFileSync("qmd", ["collection", "list"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.includes(`${name} (`);
  } catch {
    return false;
  }
}

function isDefaultDir(dir: string): boolean {
  const config = loadConfig();
  return resolve(dir) === resolve(config.dir);
}

function searchWithQmd(query: string, collection: string): void {
  try {
    const output = execFileSync("qmd", ["search", query, "-n", "10", "-c", collection], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(output);
  } catch (err) {
    const output = (err as { stdout?: string }).stdout || "";
    if (output) {
      console.log(output);
    } else {
      console.log(`No results for "${query}"`);
    }
  }
}

function searchWithGrep(query: string, dir: string): void {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const terms = query.toLowerCase().split(/\s+/);
  const results: { file: string; title: string; url: string; score: number }[] = [];

  for (const file of files) {
    let data: Record<string, unknown>;
    let content: string;
    try {
      const raw = readFileSync(join(dir, file), "utf-8");
      ({ data, content } = matter(raw));
    } catch {
      continue;
    }
    const tags = Array.isArray(data.tags) ? data.tags.join(" ") : "";
    const searchable = `${data.title || ""} ${data.summary || ""} ${tags} ${content}`.toLowerCase();

    let score = 0;
    for (const term of terms) {
      const matches = searchable.split(term).length - 1;
      if (matches > 0) score += matches;
    }

    if (score > 0) {
      results.push({
        file,
        title: (data.title as string) || file,
        url: (data.url as string) || "",
        score,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    console.log(`No results for "${query}"`);
    return;
  }

  for (const r of results.slice(0, 10)) {
    console.log(`  ${r.title}`);
    console.log(`  ${r.url}`);
    console.log();
  }

  console.log(`${results.length} result${results.length === 1 ? "" : "s"}`);
}

export async function searchStashes(query: string, opts: SearchOptions): Promise<void> {
  // Only use qmd when searching the default configured directory
  // and the "stash" collection exists. For --dir overrides, always
  // use grep to search the actual requested directory.
  if (isDefaultDir(opts.dir) && hasQmd() && qmdCollectionExists("stash")) {
    searchWithQmd(query, "stash");
  } else {
    searchWithGrep(query, opts.dir);
  }
}
