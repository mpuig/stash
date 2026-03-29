import { execSync } from "node:child_process";

export interface ExtractedContent {
  title: string;
  author: string | null;
  description: string | null;
  summary: string;
  domain: string;
  content: string;
  wordCount: number;
  published: string | null;
}

function makeSummary(description: string | null, content: string): string {
  if (description && description.length > 20) {
    return description.length > 200 ? description.slice(0, 200).trimEnd() + "…" : description;
  }
  const firstParagraph = content.split(/\n\n/)[0]?.replace(/[#*\[\]]/g, "").trim() || "";
  if (firstParagraph.length > 200) {
    return firstParagraph.slice(0, 200).trimEnd() + "…";
  }
  return firstParagraph || "No summary available";
}

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const output = execSync(`npx defuddle parse "${url}" --json`, {
    encoding: "utf-8",
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const result = JSON.parse(output);
  const domain = new URL(url).hostname;
  const description = result.description || null;
  const markdown = result.contentMarkdown || result.content || "";

  return {
    title: result.title || domain,
    author: result.author || null,
    description,
    summary: makeSummary(description, markdown),
    domain,
    content: markdown,
    wordCount: result.wordCount || 0,
    published: result.published || null,
  };
}
