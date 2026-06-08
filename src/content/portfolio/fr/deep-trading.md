---
draft: false
title: "Deep Trading"
snippet: "Plateforme de trading algorithmique de bout en bout : backtestez sur données historiques, analysez Sharpe et courbes d'équité, déployez des bots live avec garde-fous de risque — et une marketplace de stratégies. SvelteKit + intégration Alpaca."
image:
  { src: "deep-trading-banner.png", alt: "Feature graphic de la plateforme Deep Trading" }
technos:
  [
    "SvelteKit",
    "TypeScript",
    "Supabase",
    "TailwindCSS",
    "Alpaca API",
    "Python",
    "Docker",
    "Playwright",
  ]
startDate: "2024-03-01 00:00"
endDate: "2098-06-30 00:00"
github: "https://github.com/deep-trading-isep/Deep-Trading"
demo: "https://deeptrading.app"
show: true
priority: 4
---

## Vue d'ensemble

Deep Trading est une plateforme de trading algorithmique full-stack que j'ai contribué à construire à l'ISEP. Elle couvre le cycle de vie d'une stratégie de bout en bout : configurer un bot, backtester sur données historiques, analyser les métriques de performance, déployer sur les marchés live et suivre les positions en temps réel. Une marketplace permet de découvrir et d'adopter des stratégies communautaires avec un historique transparent.

En ligne sur [deeptrading.app](https://deeptrading.app). Code source sur [GitHub](https://github.com/deep-trading-isep/Deep-Trading).

## Patterns d'algo en production

Les mêmes problèmes reviennent sur toute plateforme algo sérieuse : transformer les données de marché en décisions reproductibles, valider les stratégies avant d'exposer du capital, et exécuter avec des garde-fous stricts. Deep Trading a été ma première expérience de cette boucle en tant que produit :

- **Backtest → revue → mise en live** : les stratégies sont validées sur données historiques avant déploiement ; courbes de performance et ratio de Sharpe pour décider de promouvoir un bot en production
- **Logique de stratégie séparée de l'exécution** : bots Python paramétrés (tolérance au risque, taille de position, seuils de signal) indépendants de la plateforme SvelteKit qui gère auth, financement, routage d'ordres et télémétrie
- **Garde-fous de risque intégrés** : capital alloué par bot, taille max de trade, plafonds de levier et limites de risque par trade — les ordres ne partent que dans ces bornes
- **Télémétrie temps réel** : P/L live, taux de réussite, Sharpe, courbes d'équité cumulée et historique des transactions sur chaque bot actif
- **Marketplace de stratégies** : parcourir, comparer et adopter des stratégies pré-construites avec performance publiée — une couche de découverte au-dessus de la stack d'exécution

## Mon rôle

Principal contributeur au sein d'une équipe de cinq (#1 en commits). J'ai porté une large part de la couche plateforme :

- **Dashboards trading** : vues détail bot, portfolio, données de marché et historique des trades
- **Intégration broker** : API Alpaca de bout en bout — liaison de compte, financement ACH, virements, cotations live et placement d'ordres
- **Marketplace & backtesting** : navigation stratégies, comparaison de performance et parcours du backtest au déploiement live
- **Backend plateforme** : routes serveur SvelteKit, auth Supabase, rôles utilisateurs (trader / vendeur / admin)
- **Runtime des bots** : scripts Python de stratégie et Docker Compose pour le dev local et l'orchestration

## Fonctionnalités clés

- **Bots paramétrés** : capital alloué, risque par trade, levier, marchés cibles (ex. NASDAQ-100) et sensibilité des signaux — chaque bot est une instance de stratégie isolée
- **Backtesting** : exécuter les stratégies sur données historiques et inspecter les résultats avant d'engager du capital réel
- **Exécution & monitoring live** : bots actifs avec métriques de performance, courbes d'équité et journal complet des transactions
- **Marketplace** : découvrir des stratégies communautaires avec rendement %, taux de réussite et courbes d'équité ; adopter ou acheter pour déployer sur son compte
- **Portfolio & financement** : vue unifiée des positions, données de marché et financement du compte

## Stack

Frontend et serveur SvelteKit + TypeScript, Supabase pour l'auth et la persistance, Alpaca Trade API pour la courtage et les données de marché, Python pour la logique de stratégie, Docker Compose pour l'orchestration locale. Playwright et Vitest pour les tests.

## Ce que j'ai appris

- Concevoir le **cycle de vie d'une stratégie** comme surface produit : backtest, comparer les métriques, promouvoir en live, monitorer — pas seulement livrer un graphique
- Intégrer une **API de courtage** sous contraintes réelles : auth, rails de financement, placement d'ordres et latence des données de marché
- Construire une **UX risk-first** : mettre en avant Sharpe, taux de réussite et drawdown pour raisonner avant de déployer du capital
- Séparer **logique de stratégie et exécution plateforme** — le même découpage architectural que dans les systèmes algo en production, où signaux, état et routage d'ordres vivent dans des couches distinctes
