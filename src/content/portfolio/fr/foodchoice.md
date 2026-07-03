---
draft: false
title: "FoodChoice"
snippet: "FoodChoice est une app mobile qui permet aux consommateurs français de comparer prix, Nutri-Score, origine et qualité dans 10 enseignes en temps réel. J'ai construit toute la plateforme en solo : app mobile, backend, pipeline de données et site web."
image: { src: "foodchoice-banner.png", alt: "Landing FoodChoice — Bien manger ne devrait pas être un luxe" }
technos: ["React Native", "Expo", "NestJS", "PostgreSQL", "PostGIS", "TypeScript", "Astro"]
startDate: "2026-04-25 00:00"
demo: "https://foodchoice.fr"
priority: 1
---

## Aperçu

FoodChoice (SAS NEW LIFE NOW) est une application mobile bâtie autour d'une conviction simple : **bien manger ne devrait pas être un luxe.** Elle permet aux consommateurs français de comparer les prix et la qualité des produits dans 10 grandes enseignes (Carrefour, Leclerc, Auchan, Intermarché, Lidl…) en temps réel, de filtrer selon ce qui compte pour eux — prix, Nutri-Score, origine, labels, composition — et de trouver le magasin le moins cher à proximité pour chaque produit.

En tant que développeur freelance, j'ai conçu et construit **toute la plateforme en solo** : l'app iOS/Android, le backend et son pipeline d'ingestion de données, le paiement et l'abonnement, l'infrastructure et le site vitrine.

## Le produit

- **Recherche géolocalisée & navigation par catégories** — résultats classés par distance et prix, avec un tri « Plus proche » / « Moins cher » et une vue groupée par enseigne
- **Filtres multi-critères** — Nutri-Score, NOVA, origine (France/UE), bio, gluten, huile de palme, seuils sel/sucre/gras et plus, répartis en niveaux gratuit et premium
- **Comparaison de produits** — un tap affiche chaque couple (magasin, prix) proposant un produit, toutes enseignes confondues
- **Listes & favoris** — local-first pour les utilisateurs anonymes, synchronisés côté serveur avec file d'attente hors-ligne et fusion à la connexion pour les comptes
- **Modèle freemium** — 7 recherches par jour gratuites, illimité à 3,49 €/mois

## Architecture & travail technique

Un monorepo pnpm avec deux apps :

- **Mobile (Expo 53 / React Native 0.79, Expo Router)** — UX géolocalisée avec Mapbox, quota de recherche piloté par feature flag (PostHog), achats in-app anonymes via RevenueCat vérifiés côté serveur contre les reçus signés par Apple
- **Backend (NestJS 11, TypeORM, PostgreSQL + PostGIS, BullMQ)** — recherche et classement géospatiaux, plus un pipeline d'ingestion planifié qui fusionne les relevés de prix (Stratalis) avec les données de référence alimentaires (OpenFoodFacts) en un catalogue canonique ; une archive d'observations en append-only garde la base live légère

Autour du code : déploiement Docker via Coolify, monitoring Grafana + Prometheus, sauvegardes Postgres automatisées vers Backblaze B2, et 19 architecture decision records documentant les choix de conception.

## Publication sur l'App Store

Faire approuver une app freemium à achat anonyme a demandé de travailler directement avec les guidelines d'Apple : la création de compte est un upsell opt-in (jamais une condition d'achat), les textes d'autorisation de localisation explicitent l'usage de classement par distance, et un rejet de review a été analysé et résolu avec une remédiation documentée. L'app est en ligne sur l'App Store et le Play Store.

## Le site web

J'ai aussi construit le site vitrine (`foodchoice.fr`) : un site **Astro** statique bilingue — landing, mission, FAQ, téléchargement et pages légales — avec un travail SEO/GEO pour bien apparaître dans les moteurs de recherche comme dans les réponses IA.
