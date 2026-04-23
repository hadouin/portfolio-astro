import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    snippet: z.string(),
    description: z.string().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    ogImage: z.string().optional(),
    publishDate: z.string().transform((str) => new Date(str)),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : null)),
    author: z.string().default("Hadouin Leroy"),
    category: z.string(),
    tags: z.array(z.string()),
  }),
});

const portfolioCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/portfolio" }),
  schema: z.object({
    draft: z.boolean().default(true),
    title: z.string(),
    snippet: z.string(),
    description: z.string().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    ogImage: z.string().optional(),
    technos: z.array(z.string()),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : null)),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    disabled: z.boolean().default(false),
    show: z.boolean().default(true),
    priority: z.number().default(999),
  }),
});

export const collections = {
  blog: blogCollection,
  portfolio: portfolioCollection,
};
