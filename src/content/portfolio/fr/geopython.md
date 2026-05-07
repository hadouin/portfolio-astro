---
draft: false
title: "GeoPython"
snippet: "Recréer Geometry Dash en Python."
image: { src: "GeoPython.gif", alt: "Démo Geopython" }
technos: ["python", "pygame", "git"]
startDate: "2019-04-01 00:00"
endDate: "2019-06-01 00:00"
github: "https://github.com/hadouin/GeoPython"
---

## À propos du projet

GeoPython est une recréation du fameux platformer rythmique "Geometry Dash", construit en Python avec Pygame. C'était l'un de mes premiers projets de programmation d'envergure, créé pour apprendre les fondamentaux du game dev et la programmation Python.

## Gameplay

Le gameplay reprend l'expérience originale de Geometry Dash :

- **Niveaux à défilement automatique** de gauche à droite
- **Contrôle à un bouton** : clic/tap pour sauter
- **Évitement d'obstacles** : naviguer entre piques et barrières
- **Gameplay au timing** : les sauts doivent être précis
- **Mort instantanée** : on touche un obstacle, on recommence du début

## Fonctionnalités

### Mécaniques de jeu
- **Physique fluide** pour le saut et le déplacement
- **Détection de collisions** avec les obstacles
- **Plusieurs types d'obstacles** : piques, blocs et plateformes
- **Suivi de progression** dans les niveaux

### Level design
- **Format de niveau personnalisé** pour créer facilement des niveaux
- **Arrière-plan avec scrolling** pour donner de la profondeur
- **Retour visuel** sur les actions du joueur

### Aspects techniques
- **60 FPS** pour un gameplay fluide
- **Graphismes à base de sprites** pour le joueur et les obstacles
- **Boucle de jeu** avec gestion correcte du delta time

## Implémentation technique

### Architecture Pygame

```python
# Structure de la boucle de jeu principale
while running:
    handle_events()
    update_game_state()
    render_frame()
    clock.tick(60)
```

### Composants clés

- **Classe Player** : gère les entrées, la physique et les collisions
- **Level loader** : parse les fichiers de niveau en objets de jeu
- **Obstacle manager** : fait apparaître et déplace les obstacles
- **Renderer** : dessine tous les éléments avec un layering correct

### Système physique

La mécanique de saut utilise une physique simplifiée :

- **Gravité** : accélération constante vers le bas
- **Force de saut** : vélocité instantanée vers le haut à l'input
- **Détection du sol** : empêche de tomber à travers les plateformes

## Défis surmontés

- **Indépendance au framerate** : assurer un gameplay cohérent sur différentes machines
- **Collisions précises** : rendre les hitboxes justes pour le joueur
- **Rythme des niveaux** : concevoir des niveaux exigeants mais pas frustrants

## Ce que j'en ai tiré

Ce projet a été mon introduction à :

- **Concepts de game dev** : boucles de jeu, sprites, détection de collisions
- **Bibliothèque Pygame** : gestion d'événements, rendu et audio
- **Programmation Python** : classes, I/O fichiers, code modulaire
- **Résolution de problèmes** : décomposer des systèmes complexes en parties gérables

## Réflexion

GeoPython a été un projet pivot dans mon parcours de développeur. Il m'a montré que je pouvais créer quelque chose de fun et d'interactif avec du code, ce qui a déclenché mon intérêt durable pour le développement logiciel.
