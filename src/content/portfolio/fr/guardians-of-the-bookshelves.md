---
draft: false
title: "Guardians of the bookshelves"
snippet: "Guardians of the bookshelves est un éditeur de livres-jeux en terminal. GB permet aussi de jouer aux livres que vous créez ! Projet d'école en équipe de 4 sur 2 mois."
image: { src: "gb-display.png", alt: "Aperçu GB" }
technos: ["Git", "python"]
startDate: "2020-04-01 00:00"
endDate: "2020-06-01 00:00"
github: "https://github.com/HipppB/Guardian_of_the_BookShelves"
---

## Vue d'ensemble

Guardians of the Bookshelves est un moteur de fiction interactive en terminal qui permet de **créer** et **jouer** à des livres-jeux dont vous êtes le héros. Développé en projet de groupe à 4 sur 2 mois.

## Qu'est-ce qu'un livre-jeu ?

Les livres-jeux (aussi appelés fiction interactive ou livres dont vous êtes le héros) sont des récits où le lecteur fait des choix qui influent sur l'histoire. À des moments clés, le lecteur choisit entre plusieurs options :

> *Vous entrez dans la grotte sombre. Vous décidez :*
> - *D'allumer une torche et d'avancer (page 15)*
> - *D'attendre que vos yeux s'habituent (page 23)*
> - *De faire demi-tour (page 7)*

## Fonctionnalités

### Éditeur de livres
L'éditeur permet aux auteurs de créer des livres-jeux complets :

- **Créer des pages** avec leur texte narratif
- **Ajouter des choix** qui pointent vers d'autres pages
- **Définir des conditions** d'apparition des choix (objets, flags, stats)
- **Ajouter des objets d'inventaire** que les joueurs peuvent collecter
- **Définir des fins** (victoire, défaite ou neutre)
- **Prévisualiser et tester** les livres pendant la création

### Lecteur de livres
Le lecteur offre une expérience de lecture immersive :

- **Affichage du récit** avec un formatage propre
- **Présentation des choix** et gestion des entrées du joueur
- **Suivi de l'inventaire** et de l'état du jeu
- **Sauvegarde / chargement** à n'importe quel moment
- **Support de plusieurs livres** avec un système de bibliothèque

### Format de livre
Les livres sont stockés dans un format JSON personnalisé :

```json
{
  "title": "The Lost Temple",
  "pages": {
    "1": {
      "text": "You stand before an ancient temple...",
      "choices": [
        {"text": "Enter the temple", "goto": 2},
        {"text": "Search the perimeter", "goto": 5}
      ]
    }
  }
}
```

## Implémentation technique

### Architecture

Le projet suit un design modulaire :

- **Moteur central** : gère la logique de jeu et l'état
- **Module éditeur** : interface CLI pour créer les livres
- **Module lecteur** : interface CLI pour jouer aux livres
- **Couche de stockage** : I/O fichiers pour les livres et les sauvegardes

### Collaboration en équipe

À 4, nous avons utilisé :

- **Git** pour le versioning, avec une stratégie de branches
- **Répartition des tâches** par module
- **Code reviews** avant les merges
- **Réunions de sync régulières** pour coordonner

## Défis

- **Gestion d'état** : suivre des états de jeu complexes avec conditions et inventaire
- **Expérience utilisateur** : rendre une interface terminal intuitive et agréable
- **Validation des données** : garantir que les livres sont valides et jouables avant sauvegarde
- **Coordination** : intégrer proprement le travail de 4 développeurs

## Ce que j'en ai tiré

- **Collaboration en équipe** sur une base de code partagée
- **Workflows Git** dans un environnement multi-développeurs
- **Design modulaire** pour un code maintenable
- **Design centré utilisateur** même en application CLI
- **Documentation** pour aider les coéquipiers à comprendre le code
