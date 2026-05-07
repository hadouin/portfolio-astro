---
draft: false
title: "Pokemon Java"
snippet: "Un simulateur de combats Pokémon en Java."
image:
  {
    src: "pokemonJava-display.png",
    alt: "Aperçu Pokemon Java",
  }
technos: ["Java", "JavaFX"]
startDate: "2022-10-01 00:00"
endDate: "2022-11-01 00:00"
github: "https://github.com/hadouin/PokemonJava"
---

## Vue d'ensemble

Pokemon Java est un simulateur de combats qui recrée les mécaniques classiques de combat Pokémon dans une application JavaFX. Ce projet a été monté pour explorer les concepts de game dev et pratiquer la programmation orientée objet en Java.

## Mécaniques de jeu

Le simulateur recrée fidèlement les mécaniques de combat Pokémon clés :

### Système de types
- **18 types différents** avec forces et faiblesses
- **Calculs d'efficacité de type** (super efficace, peu efficace, immunité)
- **Pokémon à double type** avec interactions combinées

### Système de combat
- **Combat au tour par tour** avec sélection d'attaque
- **Système de stats** : PV, Attaque, Défense, Attaque Spéciale, Défense Spéciale, Vitesse
- **Catégories d'attaque** : Physique, Spéciale et Statut
- **Calculs de précision et coups critiques**

### Données Pokémon
- Plusieurs Pokémon avec des stats de base fidèles
- Quatre attaques par Pokémon avec des PP (Power Points)
- Mise à l'échelle des stats par niveau

## Implémentation technique

### Architecture

Le projet suit des principes OOP propres :

```
Pokemon
├── Stats (HP, Attack, Defense, etc.)
├── Type (Fire, Water, Grass, etc.)
└── Moves[]
    ├── Power
    ├── Accuracy
    ├── Type
    └── Category
```

### Classes clés

- **Pokemon** : entité centrale avec stats, type et attaques
- **Move** : classe abstraite avec différentes implémentations d'attaque
- **Battle** : gère l'ordre des tours, le calcul des dégâts et les conditions de victoire
- **TypeChart** : gère les lookups d'efficacité de type
- **BattleUI** : interface JavaFX pour l'écran de combat

### Formule de dégâts

Le calcul des dégâts implémente la formule officielle Pokémon :

```
Damage = ((2 * Level / 5 + 2) * Power * A/D) / 50 + 2) * Modifiers
```

Où les modificateurs incluent STAB, efficacité de type, coups critiques et variation aléatoire.

## Fonctionnalités

- **Animations de combat** pour les attaques et effets
- **Barre de vie** avec transitions fluides
- **UI de sélection d'attaque** avec indicateurs de type
- **Log de combat** qui montre le résultat des actions
- **IA adverse** avec sélection d'attaque basique

## Défis

- **Équilibrer la complexité** : implémenter assez de mécaniques pour que ça sente authentique sans scope creep
- **Implémentation de la table des types** : gérer la matrice 18×18 d'efficacité efficacement
- **Timing d'animation** : synchroniser les effets visuels avec la logique de jeu

## Ce que j'en ai tiré

- Plongée profonde dans la gestion d'état de jeu
- Implémentation et test de formules complexes
- Animations et gestion d'événements JavaFX
- L'importance d'un design data-driven pour le contenu de jeu
