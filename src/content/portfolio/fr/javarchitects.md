---
draft: false
title: "Javarchitects"
snippet: "Adaptation du célèbre jeu de plateau en application JavaFX."
image:
  {
    src: "javarchitects-display.png",
    alt: "Aperçu JavArchitects",
  }
technos: ["Java", "JavaFX", "Git"]
startDate: "2022-11-01 00:00"
endDate: "2023-01-01 00:00"
github: "https://github.com/hadouin/JavArchitects"
---

## À propos du jeu

Javarchitects est une adaptation digitale du jeu de plateau "7 Wonders: Architects", construite entièrement en Java avec JavaFX pour l'interface graphique. Le projet a été développé dans le cadre d'un cours universitaire pour démontrer la maîtrise des principes de programmation orientée objet et du développement d'interfaces.

## Gameplay

Dans Javarchitects, les joueurs s'affrontent pour bâtir l'une des sept merveilles du monde antique. À chaque tour, les joueurs :

1. Piochent des cartes dans des decks partagés
2. Collectent des ressources et de la puissance militaire
3. Construisent des sections de leur merveille
4. Concourent pour la suprématie militaire

Le premier joueur à terminer sa merveille remporte la partie !

## Architecture technique

### Design patterns

Le projet exploite massivement les design patterns orientés objet :

- **Pattern MVC** : sépare la logique de jeu de la présentation
- **Pattern Observer** : pour mettre à jour l'UI quand l'état change
- **Pattern Factory** : création des différents types de cartes et composants de merveille
- **Pattern Strategy** : implémentation des comportements d'IA

### Implémentation JavaFX

L'interface graphique propose :

- **Animations** de pioche et de placement de cartes
- **Rendu dynamique du plateau** qui s'adapte à la taille de la fenêtre
- **Retour visuel** sur les actions du joueur
- **Flux au tour par tour** avec indicateurs d'état clairs

## Fonctionnalités

- **Mode solo** contre des adversaires IA
- **Multi-joueur local** de 2 à 7 joueurs
- **Plusieurs merveilles** à choisir
- **Animations de cartes** et effets visuels
- **Persistance d'état** (sauvegarde / chargement)

## Processus de développement

### Collaboration en équipe

En équipe, nous avons utilisé :

- **Git** pour le versioning, avec des branches par feature
- **Code reviews** avant chaque merge
- **Standups réguliers** pour coordonner le travail

### Défis

- **Complexité des règles** : traduire des règles de jeu de plateau en code demandait une analyse soignée
- **Réactivité de l'UI** : assurer des animations fluides sans bloquer le thread principal
- **Implémentation de l'IA** : créer des adversaires exigeants mais justes

## Ce que j'en ai tiré

Ce projet a renforcé ma compréhension de :

- L'application concrète des principes orientés objet
- Le développement d'UI en programmation événementielle
- La collaboration en équipe avec les workflows Git
- La traduction de règles du monde réel en logique logicielle
