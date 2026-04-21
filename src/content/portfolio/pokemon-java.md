---
draft: false
title: "Pokemon Java"
snippet: "A pokemon battle simulator in Java"
image:
  {
    src: "/images/display/pokemonJava-display.png",
    alt: "Pokemon Java showcase",
  }
technos: ["Java", "JavaFX"]
startDate: "2022-10-01 00:00"
endDate: "2022-11-01 00:00"
github: "https://github.com/hadouin/PokemonJava"
---

## Overview

Pokemon Java is a battle simulator that recreates the classic Pokemon battle mechanics in a JavaFX application. This project was built to explore game development concepts and practice object-oriented programming in Java.

## Game Mechanics

The simulator faithfully recreates core Pokemon battle mechanics:

### Type System
- **18 different types** with strengths and weaknesses
- **Type effectiveness** calculations (super effective, not very effective, immune)
- **Dual-type Pokemon** with combined type interactions

### Battle System
- **Turn-based combat** with move selection
- **Stats system**: HP, Attack, Defense, Special Attack, Special Defense, Speed
- **Move categories**: Physical, Special, and Status moves
- **Accuracy and critical hit** calculations

### Pokemon Data
- Multiple Pokemon with accurate base stats
- Four moves per Pokemon with PP (Power Points)
- Level-based stat scaling

## Technical Implementation

### Architecture

The project follows clean OOP principles:

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

### Key Classes

- **Pokemon**: Core entity with stats, type, and moves
- **Move**: Abstract class with different move implementations
- **Battle**: Manages turn order, damage calculation, and win conditions
- **TypeChart**: Handles type effectiveness lookups
- **BattleUI**: JavaFX interface for the battle screen

### Damage Formula

The damage calculation implements the official Pokemon formula:

```
Damage = ((2 * Level / 5 + 2) * Power * A/D) / 50 + 2) * Modifiers
```

Where modifiers include STAB, type effectiveness, critical hits, and random variation.

## Features

- **Battle animations** for attacks and effects
- **Health bar** with smooth transitions
- **Move selection UI** with type indicators
- **Battle log** showing action outcomes
- **AI opponent** with basic move selection

## Challenges

- **Balancing complexity**: Implementing enough mechanics to feel authentic without scope creep
- **Type chart implementation**: Managing the 18x18 type effectiveness matrix efficiently
- **Animation timing**: Synchronizing visual effects with game logic

## What I Learned

- Deep dive into game state management
- Complex formula implementation and testing
- JavaFX animation and event handling
- Importance of data-driven design for game content
