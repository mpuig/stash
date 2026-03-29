import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

interface ListOptions {
  limit: string;
  tag?: string;
  dir: string;
}

export async function listStashes(opts: ListOptions): Promise<void> {
  const files = readdirSync(opts.dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("No stashes yet. Run: stash <url>");
    return;
  }

  const limit = parseInt(opts.limit, 10);
  let count = 0;

  for (const file of files) {
    if (count >= limit) break;

    const raw = readFileSync(join(opts.dir, file), "utf-8");
    const { data } = matter(raw);

    if (opts.tag && !(data.tags || []).includes(opts.tag)) continue;

    const tags = data.tags?.length ? ` [${data.tags.join(", ")}]` : "";
    const saved = data.saved instanceof Date ? data.saved.toISOString().slice(0, 10) : data.saved || "?";
    console.log(`  ${saved}  ${data.title || file}${tags}`);
    console.log(`           ${data.url || ""}`);
    console.log();
    count++;
  }

  console.log(`${files.length} stashes total`);
}
