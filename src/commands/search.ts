import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { platform } from "node:os";
import matter from "gray-matter";
import { assertDirExists } from "../util.js";

export interface SearchOptions {
  dir: string;
  open?: boolean;
}

interface SearchResult {
  file: string;
  title: string;
  url: string;
  score: number;
}

function hasQmd(): boolean {
  try {
    execFileSync("which", ["qmd"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function qmdCollectionMatchesDir(dir: string): boolean {
  try {
    const output = execFileSync("qmd", ["ls", "stash"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const match = output.match(/qmd:\/\/stash\/(\S+\.md)/);
    if (!match) return false;
    return existsSync(join(dir, match[1]));
  } catch {
    return false;
  }
}

function openUrl(url: string): void {
  const os = platform();
  if (os === "darwin") {
    execFileSync("open", [url]);
  } else if (os === "win32") {
    execFileSync("cmd", ["/c", "start", "", url]);
  } else {
    execFileSync("xdg-open", [url]);
  }
}

function searchWithQmd(query: string): void {
  try {
    const output = execFileSync("qmd", ["search", query, "-n", "10", "-c", "stash"], {
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

function searchWithGrep(query: string, dir: string): SearchResult[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const terms = query.toLowerCase().split(/\s+/);
  const results: SearchResult[] = [];

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

  return results.sort((a, b) => b.score - a.score);
}

function grepBestUrl(query: string, dir: string): string | null {
  const results = searchWithGrep(query, dir);
  return results.length > 0 ? results[0].url : null;
}

export async function searchStashes(query: string, opts: SearchOptions): Promise<void> {
  assertDirExists(opts.dir);

  if (opts.open) {
    // For --open, always use grep to get the URL directly
    const url = grepBestUrl(query, opts.dir);
    if (!url) {
      console.log(`No results for "${query}"`);
      process.exit(1);
    }
    console.log(`Opening: ${url}`);
    openUrl(url);
    return;
  }

  if (hasQmd() && qmdCollectionMatchesDir(opts.dir)) {
    searchWithQmd(query);
  } else {
    const results = searchWithGrep(query, opts.dir);
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
}
