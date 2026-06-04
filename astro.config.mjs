import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import { buildSitemapLastmodMap } from "./scripts/sitemap-lastmod.mjs";

const lastmodMap = await buildSitemapLastmodMap();

function normalizeSitemapPath(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  return path;
}

export default defineConfig({
  site: "https://hadouin.com",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    icon(),
    tailwind(),
    mdx(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", fr: "fr" },
      },
      filter: (page) =>
        !page.includes("/nogooglebot") &&
        !page.endsWith("/404") &&
        !page.includes("/signature"),
      serialize(item) {
        const url = new URL(item.url);
        const path = normalizeSitemapPath(url.pathname);
        const stripFr = path.startsWith("/fr/")
          ? path.slice(3)
          : path === "/fr"
            ? "/"
            : path;
        const lastmod = lastmodMap.get(path);

        const base = lastmod ? { ...item, lastmod } : item;

        if (stripFr === "/")
          return { ...base, priority: 1.0, changefreq: "weekly" };
        if (stripFr === "/blog")
          return { ...base, priority: 0.8, changefreq: "weekly" };
        if (stripFr.startsWith("/projects/"))
          return { ...base, priority: 0.8, changefreq: "monthly" };
        if (stripFr.startsWith("/blog/"))
          return { ...base, priority: 0.7, changefreq: "monthly" };
        if (stripFr === "/contact")
          return { ...base, priority: 0.5, changefreq: "yearly" };
        return base;
      },
    }),
  ],
});
