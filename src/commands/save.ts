import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import ora from "ora";
import { extractFromUrl } from "../extract.js";
import type { StashConfig } from "../config.js";

interface SaveOptions {
  tags?: string;
  dir: string;
  config: StashConfig;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function makeFilename(title: string, date: string): string {
  return `${date}-${slugify(title)}.md`;
}

function yamlQuote(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function formatFrontmatter(meta: Record<string, unknown>): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(meta)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${yamlQuote(String(item))}`);
      }
    } else if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${yamlQuote(String(value))}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function updateQmdIndex(): void {
  try {
    execFileSync("qmd", ["update"], { stdio: "ignore", timeout: 10_000 });
  } catch {
    // qmd not installed or no collection — skip silently
  }
}

export async function stashUrl(url: string, opts: SaveOptions): Promise<void> {
  const spinner = ora(`Fetching ${url}`).start();

  try {
    const extracted = await extractFromUrl(url);
    spinner.text = "Saving...";

    const date = new Date().toISOString().slice(0, 10);
    const cliTags = opts.tags ? opts.tags.split(",").map((t) => t.trim()) : [];
    const tags = [...new Set([...opts.config.tags, ...cliTags])];

    const frontmatter = formatFrontmatter({
      url,
      title: extracted.title,
      summary: extracted.summary,
      author: extracted.author,
      domain: extracted.domain,
      published: extracted.published?.slice(0, 10) || null,
      saved: date,
      tags: tags.length > 0 ? tags : undefined,
      wordCount: extracted.wordCount,
    });

    const markdown = `${frontmatter}\n\n${extracted.content}\n`;
    const filename = makeFilename(extracted.title, date);
    const filepath = join(opts.dir, filename);

    if (existsSync(filepath)) {
      spinner.warn(`Already stashed: ${filename}`);
      return;
    }

    writeFileSync(filepath, markdown, "utf-8");
    updateQmdIndex();
    spinner.succeed(`Stashed: ${filename}`);
  } catch (err) {
    spinner.fail(`Failed: ${(err as Error).message}`);
    process.exit(1);
  }
}
