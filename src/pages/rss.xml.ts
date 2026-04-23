import type { APIContext } from "astro";
import { getCollection } from "astro:content";

const SITE_TITLE = "Hadouin Leroy — Blog";
const SITE_DESCRIPTION =
  "Articles, tutorials and notes by Hadouin Leroy on creative development, 3D, Blender, web engineering and onchain gaming.";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET({ site }: APIContext) {
  const siteUrl = site?.toString() ?? "https://hadouin.com/";
  const posts = (await getCollection("blog", ({ data }) => !data.draft))
    .filter((p) => p.data.publishDate < new Date())
    .sort(
      (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
    );

  const items = posts
    .map((post) => {
      const link = new URL(`/blog/${post.id}`, siteUrl).toString();
      const pubDate = post.data.publishDate.toUTCString();
      const description = post.data.description ?? post.data.snippet;
      const categories = post.data.tags
        .map((tag) => `    <category>${escapeXml(tag)}</category>`)
        .join("\n");
      return `  <item>
    <title>${escapeXml(post.data.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(description)}</description>
    <author>noreply@hadouin.com (${escapeXml(post.data.author)})</author>
${categories}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link>${siteUrl}</link>
  <atom:link href="${new URL("/rss.xml", siteUrl).toString()}" rel="self" type="application/rss+xml" />
  <description>${escapeXml(SITE_DESCRIPTION)}</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
