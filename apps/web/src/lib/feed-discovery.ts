import { parseHTML } from "linkedom";
import { fetchFeed, type ParsedFeed } from "./feed-parser";

const FEED_MIME_TYPES = [
  "application/rss+xml",
  "application/atom+xml",
  "application/xml",
  "text/xml",
];

/**
 * Fetch an HTML page and look for `<link rel="alternate">` feed URLs.
 * Returns the first RSS/Atom feed URL found, or null.
 */
export async function discoverFeedUrl(
  url: string,
): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") ?? "";
  // If the response is already XML/feed content, the URL itself is a feed
  if (
    contentType.includes("xml") ||
    contentType.includes("rss") ||
    contentType.includes("atom")
  ) {
    return url;
  }

  const html = await response.text();
  const { document } = parseHTML(html);

  const linkEl = document.querySelector(
    FEED_MIME_TYPES.map(
      (t) => `link[rel="alternate"][type="${t}"]`,
    ).join(", "),
  );

  if (!linkEl) return null;

  const href = linkEl.getAttribute("href");
  if (!href) return null;

  // Resolve relative URLs
  try {
    return new URL(href, url).href;
  } catch {
    return null;
  }
}

/**
 * Given a URL, try to fetch it as a feed directly.
 * If that fails (not valid XML), try auto-discovery on the HTML page.
 * Returns the resolved feed URL and parsed feed data.
 */
export async function resolveAndFetchFeed(
  url: string,
): Promise<{ feedUrl: string; feed: ParsedFeed }> {
  // First, try parsing as a feed directly
  try {
    const feed = await fetchFeed(url);
    return { feedUrl: url, feed };
  } catch {
    // Not a feed URL — try auto-discovery
  }

  const discoveredUrl = await discoverFeedUrl(url);
  if (!discoveredUrl) {
    throw new Error(
      `No RSS/Atom feed found at ${url}. Try providing the feed URL directly.`,
    );
  }

  const feed = await fetchFeed(discoveredUrl);
  return { feedUrl: discoveredUrl, feed };
}
