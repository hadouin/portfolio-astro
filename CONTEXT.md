# Hadouin Portfolio

A bilingual (EN/FR) static portfolio built with Astro, showcasing projects, experience, blog posts, and a copy-paste email signature.

## Language

**Project**:
A portfolio entry under `src/content/portfolio/{en,fr}/*.md` describing one piece of past work.
_Avoid_: Work, case study, entry.

**Job**:
A role held at a company, listed in `src/content/jobs/`.
_Avoid_: Position, gig, experience-item.

**Signature**:
The standalone `/signature` page that renders an HTML email signature for copy-paste into a mail client. EN-only; not part of the bilingual surface.
_Avoid_: Email footer, sig block.

**Default Locale**:
English. Served at the unprefixed root (`/`, `/projects/...`). All inbound links and SEO history target this.

**Secondary Locale**:
French. Served under `/fr/` prefix.

**Locale-Agnostic Term**:
An identifier that stays in English across all locales because the FR-tech audience uses the EN form natively. Covers job titles ("Founding Engineer", "Creative Developer"), tech/framework names, and product/company names. Translators must leave these untouched even inside French prose.
_Avoid_: Untranslatable, proper noun (too broad).

**Translation Pending**:
A `/fr/...` page rendered with EN body content plus a visible badge, used as fallback when the FR markdown counterpart is missing. Decided over a hard build-block to keep authoring frictionless.
_Avoid_: Missing translation, untranslated.

## Relationships

- Each **Project** has one EN file and one FR file sharing a slug; switching locale swaps in place to the paired URL.
- The **Signature** page is the only public page outside the bilingual surface.
- A **Locale-Agnostic Term** is a constraint on translation, not a separate piece of content.

## Flagged ambiguities

- "title" was ambiguous — distinguished as **Page title** (translatable, lives in UI dictionary or markdown frontmatter) vs **Job title** (Locale-Agnostic Term, stays EN).
