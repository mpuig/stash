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
  let shown = 0;
  let matched = 0;

  for (const file of files) {
    let data: Record<string, unknown>;
    try {
      const raw = readFileSync(join(opts.dir, file), "utf-8");
      ({ data } = matter(raw));
    } catch {
      console.error(`  (skipped ${file}: malformed frontmatter)`);
      continue;
    }

    const tags = Array.isArray(data.tags) ? data.tags : [];
    if (opts.tag && !tags.includes(opts.tag)) continue;

    matched++;
    if (shown >= limit) continue;

    const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
    const saved = data.saved instanceof Date ? data.saved.toISOString().slice(0, 10) : data.saved || "?";
    console.log(`  ${saved}  ${data.title || file}${tagStr}`);
    console.log(`           ${data.url || ""}`);
    console.log();
    shown++;
  }

  if (opts.tag) {
    console.log(`${matched} matching stash${matched === 1 ? "" : "es"} (${files.length} total)`);
  } else {
    console.log(`${matched} stash${matched === 1 ? "" : "es"}`);
  }
}
