import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT = join(ROOT, "src/content");

function normalizePath(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  return path;
}

function setLatest(map, path, date) {
  if (!date || Number.isNaN(date.getTime())) return;
  const iso = date.toISOString();
  const existing = map.get(path);
  if (!existing || iso > existing) map.set(path, iso);
}

function readFrontmatterDate(content, fields) {
  for (const field of fields) {
    const match = content.match(
      new RegExp(`^${field}:\\s*["']?([^"'\\n]+)`, "m"),
    );
    if (match) {
      const date = new Date(match[1].trim());
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

/** Ignore placeholder far-future end dates (e.g. ongoing projects). */
function contentLastmod(content, { endFields, startFields }) {
  const endDate = readFrontmatterDate(content, endFields);
  const startDate = readFrontmatterDate(content, startFields);
  const now = Date.now();
  const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

  if (endDate && endDate.getTime() <= oneYearFromNow) return endDate;
  return startDate;
}

async function readMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Build pathname → ISO lastmod from content frontmatter (not build time).
 */
export async function buildSitemapLastmodMap() {
  const map = new Map();
  let siteLatest = null;
  let blogLatest = null;

  const portfolioFiles = await readMarkdownFiles(join(CONTENT, "portfolio"));
  for (const filePath of portfolioFiles) {
    const content = await readFile(filePath, "utf8");
    if (/^draft:\s*true/m.test(content)) continue;

    const relative = filePath.split("/portfolio/")[1];
    const [locale, filename] = relative.split("/");
    const slug = filename.replace(/\.mdx?$/, "");
    const path =
      locale === "fr" ? `/fr/projects/${slug}` : `/projects/${slug}`;
    const date =
      contentLastmod(content, {
        endFields: ["endDate"],
        startFields: ["startDate"],
      }) ?? null;
    setLatest(map, normalizePath(path), date);
    if (date && (!siteLatest || date > siteLatest)) siteLatest = date;
  }

  const blogFiles = await readMarkdownFiles(join(CONTENT, "blog"));
  for (const filePath of blogFiles) {
    const content = await readFile(filePath, "utf8");
    if (/^draft:\s*true/m.test(content)) continue;

    const relative = filePath.split("/blog/")[1];
    const [locale, filename] = relative.split("/");
    const slug = filename.replace(/\.mdx?$/, "");
    const path = locale === "fr" ? `/fr/blog/${slug}` : `/blog/${slug}`;
    const date =
      contentLastmod(content, {
        endFields: ["updatedDate"],
        startFields: ["publishDate"],
      }) ?? null;
    setLatest(map, normalizePath(path), date);
    if (date && (!siteLatest || date > siteLatest)) siteLatest = date;
    if (date && (!blogLatest || date > blogLatest)) blogLatest = date;
  }

  if (siteLatest) {
    setLatest(map, "/", siteLatest);
    setLatest(map, "/fr", siteLatest);
  }

  if (blogLatest) {
    setLatest(map, "/blog", blogLatest);
    setLatest(map, "/fr/blog", blogLatest);
  }

  return map;
}
