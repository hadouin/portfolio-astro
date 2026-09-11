#!/usr/bin/env node

/**
 * Fails the build if an em dash reaches the site.
 *
 * The site never uses em dashes, in any language, in any surface: portfolio
 * content, i18n strings, page titles, RSS, llms.txt, or source comments. Use a
 * colon, a comma, parentheses, or two sentences instead.
 *
 * Usage:
 *   node scripts/check-no-emdash.mjs
 *
 * Runs automatically before `pnpm build` via the `prebuild` script.
 */

import { readdir, readFile } from "fs/promises";
import { dirname, extname, join, relative } from "path";
import { fileURLToPath } from "url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Directories whose contents ship to visitors, or compile into what does. */
const ROOTS = ["src", "public"];

/** Text formats worth scanning. Anything else is treated as binary. */
const EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".js",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".svelte",
  ".ts",
  ".txt",
  ".xml",
]);

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".astro"]);

/** U+2014 EM DASH. */
const EM_DASH = "—";

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(entry.name))) yield path;
  }
}

const offences = [];

for (const root of ROOTS) {
  for await (const path of walk(join(projectRoot, root))) {
    const lines = (await readFile(path, "utf8")).split("\n");
    lines.forEach((line, i) => {
      if (!line.includes(EM_DASH)) return;
      offences.push({
        file: relative(projectRoot, path),
        line: i + 1,
        text: line.trim(),
      });
    });
  }
}

if (offences.length === 0) {
  console.log("No em dashes found.");
  process.exit(0);
}

console.error(
  `Found ${offences.length} em dash${offences.length === 1 ? "" : "es"}. ` +
    "The site does not use them. Replace with a colon, a comma, parentheses, " +
    "or split into two sentences.\n",
);
for (const { file, line, text } of offences) {
  console.error(`  ${file}:${line}`);
  console.error(`    ${text}`);
}
process.exit(1);
