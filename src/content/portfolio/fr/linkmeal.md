---
draft: false
title: "LinkMeal"
snippet: "Linkmeal est l'application qui lutte contre le gaspillage alimentaire et la précarité étudiante en permettant aux étudiants d'échanger leurs repas non consommés."
image: { src: "linkmeal-display.png", alt: "Aperçu Linkmeal" }
technos: ["ReactNative", "Symfony", "UI/UX", "JavaScript"]
startDate: "2020-02-01 00:00"
endDate: "2020-06-08 00:00"
github: "https://github.com/hadouin/LinkMeal"
priority: 6
---

## Le problème

Le gaspillage alimentaire est un problème massif, particulièrement dans les universités. En parallèle, beaucoup d'étudiants sont en situation de précarité alimentaire. LinkMeal est né de l'idée de connecter ces deux problèmes en une seule solution.

## La solution

LinkMeal est une application mobile qui permet aux étudiants de partager leurs crédits-repas inutilisés ou les restes de leur plateau avec d'autres étudiants. L'app crée une approche communautaire pour réduire le gaspillage tout en aidant les étudiants dans le besoin.

## Fonctionnalités

### Pour les donneurs
- Publier les repas ou crédits-repas disponibles
- Définir les horaires et lieux de récupération
- Suivre l'historique des dons
- Recevoir des notifications quand un repas est réservé

### Pour les receveurs
- Parcourir les repas disponibles à proximité
- Demander un repas en un tap
- Coordonner la récupération avec le donneur
- Noter et remercier les donneurs

### Fonctionnalités communautaires
- Communautés spécifiques à chaque campus
- Classements des meilleurs donneurs
- Statistiques d'impact (repas sauvés, gaspillage réduit)

## Implémentation technique

### App mobile (React Native)
Le frontend a été construit en React Native pour offrir une expérience fluide sur iOS comme sur Android. Choix techniques clés :

- **Redux** pour la gestion d'état
- **React Navigation** pour les transitions d'écrans fluides
- **Notifications push** pour les alertes repas en temps réel
- **Géolocalisation** pour découvrir les repas à proximité

### Backend (Symfony)
L'API a été construite en Symfony, fournissant :

- Endpoints RESTful
- Authentification et autorisation utilisateur
- Gestion de la base de données via Doctrine ORM
- Notifications temps réel via WebSockets

## Mes contributions

Au sein de l'équipe de développement, j'étais responsable de :

- La conception **UI/UX** de l'application mobile
- L'implémentation des fonctionnalités frontend en React Native
- La collaboration sur le design et l'intégration de l'API
- Les tests utilisateurs et l'itération à partir des retours

## Défis surmontés

- **Coordination temps réel** : permettre aux donneurs et receveurs de communiquer efficacement
- **Confiance et sécurité** : construire des features pour vérifier les utilisateurs et garantir des échanges sûrs
- **Adoption** : créer un onboarding intuitif pour grossir la base utilisateurs

## Impact

Pendant notre phase pilote, LinkMeal a aidé à redistribuer des dizaines de repas qui auraient autrement été jetés, démontrant la viabilité du partage de nourriture entre pairs chez les étudiants.
