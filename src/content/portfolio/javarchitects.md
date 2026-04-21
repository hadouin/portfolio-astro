---
draft: false
title: "Javarchitects"
snippet: "Making the famous board game into a JavaFX application"
image:
  {
    src: "javarchitects-display.png",
    alt: "JavArchitects showcase",
  }
technos: ["Java", "JavaFX", "Git"]
startDate: "2022-11-01 00:00"
endDate: "2023-01-01 00:00"
github: "https://github.com/hadouin/JavArchitects"
---

## About the Game

Javarchitects is a digital adaptation of the popular board game "7 Wonders: Architects" built entirely in Java with JavaFX for the graphical interface. The project was developed as part of a university course to demonstrate object-oriented programming principles and GUI development skills.

## Gameplay

In Javarchitects, players compete to build one of the seven wonders of the ancient world. Each turn, players:

1. Draw cards from shared decks
2. Collect resources and military strength
3. Build sections of their wonder
4. Compete for military supremacy

The first player to complete their wonder wins the game!

## Technical Architecture

### Design Patterns

The project heavily utilizes object-oriented design patterns:

- **MVC Pattern**: Separating game logic from presentation
- **Observer Pattern**: For updating the UI when game state changes
- **Factory Pattern**: Creating different card types and wonder components
- **Strategy Pattern**: Implementing different AI behaviors

### JavaFX Implementation

The graphical interface features:

- **Animated card drawing** and placement
- **Dynamic board rendering** that scales with window size
- **Visual feedback** for player actions
- **Turn-based flow** with clear state indicators

## Features

- **Single-player mode** against AI opponents
- **Local multiplayer** for 2-7 players
- **Multiple wonders** to choose from
- **Card animations** and visual effects
- **Game state persistence** (save/load)

## Development Process

### Team Collaboration

Working in a team environment, we used:

- **Git** for version control with feature branches
- **Code reviews** before merging changes
- **Regular standups** to coordinate work

### Challenges

- **Game rule complexity**: Translating board game rules into code required careful analysis
- **UI responsiveness**: Ensuring smooth animations without blocking the main thread
- **AI implementation**: Creating challenging but fair computer opponents

## What I Learned

This project reinforced my understanding of:

- Object-oriented programming principles in practice
- GUI development with event-driven programming
- Team collaboration using Git workflows
- Translating real-world rules into software logic
