import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";

interface SearchOptions {
  dir: string;
}

function hasQmd(): boolean {
  try {
    execSync("which qmd", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function qmdCollectionExists(): boolean {
  try {
    const output = execSync("qmd collection list", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    return output.includes("stash");
  } catch {
    return false;
  }
}

function searchWithQmd(query: string): void {
  try {
    const output = execSync(`qmd search "${query.replace(/"/g, '\\"')}" -n 10 -c stash`, {
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
    const raw = readFileSync(join(dir, file), "utf-8");
    const { data, content } = matter(raw);
    const searchable = `${data.title || ""} ${data.description || ""} ${data.tags?.join(" ") || ""} ${content}`.toLowerCase();

    let score = 0;
    for (const term of terms) {
      const matches = searchable.split(term).length - 1;
      if (matches > 0) score += matches;
    }

    if (score > 0) {
      results.push({
        file,
        title: data.title || file,
        url: data.url || "",
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
  if (hasQmd() && qmdCollectionExists()) {
    searchWithQmd(query);
  } else {
    searchWithGrep(query, opts.dir);
  }
}
