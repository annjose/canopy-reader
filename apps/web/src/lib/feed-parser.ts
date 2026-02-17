import { XMLParser } from "fast-xml-parser";

// --- Public types ---

export interface ParsedFeedItem {
  title: string;
  url: string;
  description: string | null;
  contentHtml: string | null;
  author: string | null;
  publishedAt: string | null;
  guid: string | null;
  imageUrl: string | null;
}

export interface ParsedFeed {
  title: string;
  siteUrl: string | null;
  description: string | null;
  language: string | null;
  iconUrl: string | null;
  items: ParsedFeedItem[];
}

// --- Parser ---

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) =>
    name === "item" || name === "entry" || name === "link",
});

/**
 * Parse RSS 2.0 or Atom XML into a normalized ParsedFeed.
 */
export function parseFeed(xml: string): ParsedFeed {
  const doc = parser.parse(xml);

  if (doc.rss) {
    return parseRss2(doc.rss);
  }
  if (doc.feed) {
    return parseAtom(doc.feed);
  }

  throw new Error("Unrecognized feed format: expected RSS 2.0 or Atom");
}

/**
 * Fetch a feed URL and parse the XML response.
 */
export async function fetchFeed(url: string): Promise<ParsedFeed> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed ${url}: ${response.status}`);
  }

  const xml = await response.text();
  return parseFeed(xml);
}

// --- RSS 2.0 ---

function parseRss2(rss: Record<string, unknown>): ParsedFeed {
  const channel = (rss as { channel?: Record<string, unknown> }).channel ?? {};

  const items = asArray(channel.item).map(
    (item: Record<string, unknown>): ParsedFeedItem => {
      const enclosure = item.enclosure as
        | Record<string, string>
        | undefined;
      const enclosureUrl =
        enclosure?.["@_url"] &&
        String(enclosure["@_type"] ?? "").startsWith("image/")
          ? enclosure["@_url"]
          : null;

      return {
        title: text(item.title) ?? "Untitled",
        url: text(item.link) ?? "",
        description: text(item.description),
        contentHtml: text(item["content:encoded"]),
        author:
          text(item["dc:creator"]) ?? text(item.author),
        publishedAt: text(item.pubDate),
        guid: text(item.guid) ?? text((item.guid as Record<string, unknown>)?.["#text"]),
        imageUrl:
          enclosureUrl ??
          text(
            (item["media:content"] as Record<string, string>)?.["@_url"],
          ),
      };
    },
  );

  return {
    title: text(channel.title) ?? "Untitled Feed",
    siteUrl: text(channel.link),
    description: text(channel.description),
    language: text(channel.language),
    iconUrl:
      text(
        (channel.image as Record<string, unknown>)?.url,
      ) ?? null,
    items,
  };
}

// --- Atom ---

function parseAtom(feed: Record<string, unknown>): ParsedFeed {
  const entries = asArray(feed.entry).map(
    (entry: Record<string, unknown>): ParsedFeedItem => {
      const links = asArray(entry.link);
      const altLink = links.find(
        (l) => l["@_rel"] === "alternate" || !l["@_rel"],
      );

      const content = entry.content as Record<string, unknown> | string | undefined;
      const contentHtml =
        typeof content === "string"
          ? content
          : typeof content === "object" && content
            ? text(content["#text"])
            : null;

      return {
        title: text(entry.title) ?? "Untitled",
        url:
          String((altLink as Record<string, unknown>)?.["@_href"] ?? ""),
        description: text(entry.summary),
        contentHtml,
        author: text(
          (entry.author as Record<string, unknown>)?.name,
        ),
        publishedAt:
          text(entry.published) ?? text(entry.updated),
        guid: text(entry.id),
        imageUrl: null,
      };
    },
  );

  const links = asArray(feed.link);
  const siteLink = links.find(
    (l) => l["@_rel"] === "alternate" || !l["@_rel"],
  );

  return {
    title: text(feed.title) ?? "Untitled Feed",
    siteUrl:
      siteLink ? String((siteLink as Record<string, unknown>)["@_href"] ?? "") || null : null,
    description: text(feed.subtitle),
    language: text(feed["@_xml:lang"]),
    iconUrl: text(feed.icon) ?? text(feed.logo),
    items: entries,
  };
}

// --- Helpers ---

function text(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val.trim() || null;
  if (typeof val === "number") return String(val);
  if (typeof val === "object" && "#text" in (val as Record<string, unknown>)) {
    return text((val as Record<string, unknown>)["#text"]);
  }
  return null;
}

function asArray(val: unknown): Record<string, unknown>[] {
  if (Array.isArray(val)) return val;
  if (val != null && typeof val === "object") return [val as Record<string, unknown>];
  return [];
}
