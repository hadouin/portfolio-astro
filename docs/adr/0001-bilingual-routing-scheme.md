# Bilingual routing: default-no-prefix EN + `/fr/` prefix

The portfolio shipped as English-only with indexed URLs and a recent SEO investment (commit `c0f694c`). Adding French as a second locale, we keep English at the unprefixed root (`/`, `/projects/emi`) and serve French under a `/fr/` prefix (`/fr/`, `/fr/projects/emi`). Symmetric prefixing (`/en/` + `/fr/`) was rejected because it would invalidate every existing inbound link and the sitemap entries Google has already crawled. Configured via Astro's built-in i18n with `prefixDefaultLocale: false` and `redirectToDefaultLocale: false`.
