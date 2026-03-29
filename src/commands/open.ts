import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";

interface OpenOptions {
  dir: string;
}

export async function openStash(query: string, opts: OpenOptions): Promise<void> {
  const files = readdirSync(opts.dir).filter((f) => f.endsWith(".md"));
  const terms = query.toLowerCase().split(/\s+/);

  let best: { url: string; title: string; score: number } | null = null;

  for (const file of files) {
    const raw = readFileSync(join(opts.dir, file), "utf-8");
    const { data, content } = matter(raw);
    const searchable = `${data.title || ""} ${data.description || ""} ${content}`.toLowerCase();

    let score = 0;
    for (const term of terms) {
      const matches = searchable.split(term).length - 1;
      if (matches > 0) score += matches;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { url: data.url, title: data.title || file, score };
    }
  }

  if (!best?.url) {
    console.log(`No results for "${query}"`);
    process.exit(1);
  }

  console.log(`Opening: ${best.title}`);
  console.log(`  ${best.url}`);
  execSync(`open "${best.url}"`);
}
