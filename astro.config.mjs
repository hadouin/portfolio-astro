import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

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
    tailwind(),
    mdx(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
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
        const path = url.pathname.replace(/\/$/, "") || "/";
        const stripFr = path.startsWith("/fr/")
          ? path.slice(3)
          : path === "/fr"
          ? "/"
          : path;
        if (stripFr === "/") return { ...item, priority: 1.0, changefreq: "weekly" };
        if (stripFr === "/blog") return { ...item, priority: 0.8, changefreq: "weekly" };
        if (stripFr.startsWith("/projects/")) return { ...item, priority: 0.8, changefreq: "monthly" };
        if (stripFr.startsWith("/blog/")) return { ...item, priority: 0.7, changefreq: "monthly" };
        if (stripFr === "/contact") return { ...item, priority: 0.5, changefreq: "yearly" };
        return item;
      },
    }),
  ],
});
