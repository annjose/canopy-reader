import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { extractDomain, calculateReadingTime } from "./utils";

export interface ParsedArticle {
  title: string;
  author: string | null;
  content: string;
  excerpt: string | null;
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: string | null;
  language: string | null;
  imageUrl: string | null;
  domain: string;
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const { document } = parseHTML(html);

  // Extract og:image before Readability strips meta tags
  const ogImage =
    document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content") ?? null;

  // Extract language
  const language =
    document.documentElement?.getAttribute("lang") ?? null;

  // Run Readability
  const article = new Readability(document).parse();
  if (!article) {
    throw new Error(`Readability could not parse ${url}`);
  }

  // Count words from text content
  const textContent = article.textContent ?? "";
  const wordCount = textContent
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    title: article.title ?? "Untitled",
    author: article.byline ?? null,
    content: article.content ?? "",
    excerpt: article.excerpt ?? null,
    wordCount,
    readingTimeMinutes: calculateReadingTime(wordCount),
    publishedAt: null,
    language,
    imageUrl: ogImage,
    domain: extractDomain(url),
  };
}
