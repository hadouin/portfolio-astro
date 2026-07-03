---
draft: false
title: "FoodChoice"
snippet: "FoodChoice is a mobile app that lets French shoppers compare price, Nutri-Score, origin and quality across 10 supermarkets in real time. I built the entire platform solo: mobile app, backend, data pipeline and website."
image: { src: "foodchoice-banner.png", alt: "FoodChoice landing — Bien manger ne devrait pas être un luxe" }
technos: ["React Native", "Expo", "NestJS", "PostgreSQL", "PostGIS", "TypeScript", "Astro"]
startDate: "2026-04-25 00:00"
demo: "https://foodchoice.fr"
priority: 1
---

## Overview

FoodChoice (SAS NEW LIFE NOW) is a mobile app built around a simple conviction: **eating well shouldn't be a luxury.** It lets French consumers compare grocery prices and product quality across 10 major retailers (Carrefour, Leclerc, Auchan, Intermarché, Lidl…) in real time, filter by what matters to them — price, Nutri-Score, origin, labels, composition — and find the cheapest nearby store for any product.

As a freelance developer, I designed and built the **entire platform solo**: the iOS/Android app, the backend and its data-ingestion pipeline, the payment and subscription flow, the infrastructure, and the marketing website.

## The Product

- **Geolocated search & category browse** — results ranked by distance and price, with a "closest first" / "cheapest first" sort and a per-retailer grouped view
- **Multi-criteria filters** — Nutri-Score, NOVA, origin (France/EU), organic, gluten, palm oil, salt/sugar/fat thresholds and more, split into free and premium tiers
- **Product comparison** — one tap shows every (store, price) pair carrying a product across all retailers
- **Lists & favorites** — local-first for anonymous users, server-synced with offline queue and merge-on-sign-in for accounts
- **Freemium model** — 7 searches per day free, unlimited at €3.49/month

## Architecture & Technical Work

A pnpm monorepo with two apps:

- **Mobile (Expo 53 / React Native 0.79, Expo Router)** — geolocated UX with Mapbox, feature-flagged search quota (PostHog), anonymous in-app purchases via RevenueCat verified server-side against Apple-signed receipts
- **Backend (NestJS 11, TypeORM, PostgreSQL + PostGIS, BullMQ)** — geospatial search and ranking, plus a scheduled ingestion pipeline merging retail price observations (Stratalis) with food reference data (OpenFoodFacts) into a canonical catalogue; an append-only observation archive keeps the live database lean

Around the code: Docker-based deployment via Coolify, Grafana + Prometheus monitoring, automated Postgres backups to Backblaze B2, and 19 architecture decision records documenting the design choices.

## Shipping to the App Store

Getting a freemium, anonymous-purchase app approved meant working through Apple's guidelines directly: account creation is an opt-in upsell (never a purchase precondition), location purpose strings state the ranking use case explicitly, and a review rejection was analysed and resolved with a documented remediation. The app is live on the App Store and Play Store.

## The Website

I also built the marketing site (`foodchoice.fr`): a static bilingual **Astro** site — landing, mission, FAQ, download and legal pages — with SEO/GEO work so it surfaces well in both search engines and AI answers.
