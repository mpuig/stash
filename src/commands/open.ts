import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { platform } from "node:os";
import matter from "gray-matter";

interface OpenOptions {
  dir: string;
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

export async function openStash(query: string, opts: OpenOptions): Promise<void> {
  const files = readdirSync(opts.dir).filter((f) => f.endsWith(".md"));
  const terms = query.toLowerCase().split(/\s+/);

  let best: { url: string; title: string; score: number } | null = null;

  for (const file of files) {
    let data: Record<string, unknown>;
    let content: string;
    try {
      const raw = readFileSync(join(opts.dir, file), "utf-8");
      ({ data, content } = matter(raw));
    } catch {
      continue;
    }
    const searchable = `${data.title || ""} ${data.summary || ""} ${content}`.toLowerCase();

    let score = 0;
    for (const term of terms) {
      const matches = searchable.split(term).length - 1;
      if (matches > 0) score += matches;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { url: data.url as string, title: (data.title as string) || file, score };
    }
  }

  if (!best?.url) {
    console.log(`No results for "${query}"`);
    process.exit(1);
  }

  console.log(`Opening: ${best.title}`);
  console.log(`  ${best.url}`);
  openUrl(best.url);
}
