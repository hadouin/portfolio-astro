---
draft: false
title: "FreeRoom • Edelweiss"
snippet: "Recherche en temps réel des salles libres pour les étudiants de l'ISEP. App full-stack SvelteKit avec Prisma, PostgreSQL et ingestion d'événements planifiée, livrée avec l'association étudiante Edelweiss."
image:
  { src: "freeroom-edelweiss-banner.png", alt: "Bannière Edelweiss FreeRoom" }
technos: ["Svelte", "SvelteKit", "TypeScript", "Prisma", "PostgreSQL", "TailwindCSS", "Docker"]
startDate: "2023-09-01 08:00"
endDate: "2024-06-30 00:00"
github: "https://github.com/hadouin/isep-freeroom-6"
demo: "https://isep-freeroom-6.vercel.app/"
show: true
---

## Vue d'ensemble

FreeRoom est la troisième itération d'une web app qui aide les étudiants de l'ISEP à trouver les salles disponibles en temps réel. Livrée sous l'égide de l'association étudiante Edelweiss, elle ingère les emplois du temps de l'école, les normalise dans une base Postgres et expose les salles libres sur une interface rapide et mobile-friendly.

## Mon rôle

- **Développement full-stack** : frontend SvelteKit + routes serveur
- **Couche de données** : schéma Prisma, migrations et seeders sur PostgreSQL
- **Pipeline d'ingestion** : endpoint planifié (`/api/events/update`) déclenché par cron pour rafraîchir les événements toutes les 15 minutes pendant les heures de cours
- **DevOps** : Docker compose pour la DB locale, déploiement en production

## Fonctionnalités clés

- Vue live des salles libres et occupées dans tous les bâtiments de l'ISEP
- Sync automatique des événements toutes les 15 minutes (7h–22h45, lun.–ven.)
- Support offline via service worker
- Installation PWA aux couleurs Edelweiss (manifest, icônes)

## Ce que j'en ai tiré

- Endpoints serveur et load functions de SvelteKit
- Workflow de migrations Prisma et scripts de seed
- Concevoir des jobs planifiés idempotents pour des données d'emploi du temps
- Livrer un produit maintenu pour une vraie base d'utilisateurs étudiants
