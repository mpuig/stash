import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

interface SearchOptions {
  dir: string;
}

export async function searchStashes(query: string, opts: SearchOptions): Promise<void> {
  const files = readdirSync(opts.dir).filter((f) => f.endsWith(".md"));
  const terms = query.toLowerCase().split(/\s+/);
  const results: { file: string; title: string; url: string; score: number }[] = [];

  for (const file of files) {
    const raw = readFileSync(join(opts.dir, file), "utf-8");
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
