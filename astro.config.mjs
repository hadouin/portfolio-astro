import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://hadouin.com",
  trailingSlash: "ignore",
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) =>
        !page.includes("/nogooglebot") && !page.endsWith("/404"),
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname.replace(/\/$/, "") || "/";
        if (path === "/") return { ...item, priority: 1.0, changefreq: "weekly" };
        if (path === "/blog") return { ...item, priority: 0.8, changefreq: "weekly" };
        if (path.startsWith("/projects/")) return { ...item, priority: 0.8, changefreq: "monthly" };
        if (path.startsWith("/blog/")) return { ...item, priority: 0.7, changefreq: "monthly" };
        if (path === "/contact") return { ...item, priority: 0.5, changefreq: "yearly" };
        return item;
      },
    }),
  ],
});
