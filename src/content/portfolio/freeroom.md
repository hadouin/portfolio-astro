---
draft: false
title: "FreeRoom • Edelweiss"
snippet: "Real-time free classroom finder for ISEP students. SvelteKit full-stack app with Prisma, PostgreSQL and scheduled event ingestion, built with the Edelweiss student association."
image:
  { src: "/images/display/freeroom-edelweiss-banner.png", alt: "Edelweiss FreeRoom banner" }
technos: ["Svelte", "SvelteKit", "TypeScript", "Prisma", "PostgreSQL", "TailwindCSS", "Docker"]
startDate: "2023-09-01 08:00"
endDate: "2024-06-30 00:00"
github: "https://github.com/hadouin/isep-freeroom-6"
demo: "https://isep-freeroom-6.vercel.app/"
show: true
---

## Overview

FreeRoom is the third iteration of a web app that helps ISEP students find available classrooms in real time. Shipped under the Edelweiss student association, it ingests school schedules, normalizes them into a Postgres database, and surfaces free rooms on a fast, mobile-friendly interface.

## My Role

- **Full-stack development**: SvelteKit frontend + server routes
- **Data layer**: Prisma schema, migrations and seeders on PostgreSQL
- **Ingestion pipeline**: scheduled endpoint (`/api/events/update`) triggered by cron to refresh events every 15 minutes during school hours
- **DevOps**: Docker compose for local DB, production deployment

## Key Features

- Live view of free and occupied rooms across ISEP buildings
- Automatic event sync every 15 minutes (7h–22h45, Mon–Fri)
- Offline support via service worker
- PWA install with Edelweiss branding (manifest, icons)

## What I Learned

- SvelteKit server endpoints and load functions
- Prisma migration workflow and seed scripts
- Designing idempotent scheduled jobs for schedule data
- Shipping a maintained product for a real student user base
