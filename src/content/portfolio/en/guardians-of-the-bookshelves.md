---
draft: false
title: "Guardians of the bookshelves"
snippet: "Guardians of the bookshelves is a game book editor in the terminal. GB also offers you to play the books you create! A class project in groups of 4 over 2 months"
image: { src: "gb-display.png", alt: "GB showcase" }
technos: ["Git", "python"]
startDate: "2020-04-01 00:00"
endDate: "2020-06-01 00:00"
github: "https://github.com/HipppB/Guardian_of_the_BookShelves"
---

## Project Overview

Guardians of the Bookshelves is a terminal-based interactive fiction engine that allows users to both **create** and **play** "choose your own adventure" style game books. Developed as a group project with 4 team members over 2 months.

## What is a Game Book?

Game books (also known as interactive fiction or CYOA books) are stories where readers make choices that affect the narrative. At key points, the reader chooses between options like:

> *You enter the dark cave. Do you:*
> - *Light a torch and proceed (go to page 15)*
> - *Wait for your eyes to adjust (go to page 23)*
> - *Turn back (go to page 7)*

## Features

### Book Editor
The editor allows authors to create complete game books:

- **Create pages** with narrative text
- **Add choices** that link to other pages
- **Set conditions** for choice availability (items, flags, stats)
- **Add inventory items** that players can collect
- **Define endings** (win, lose, or neutral)
- **Preview and test** books during creation

### Book Player
The player provides an immersive reading experience:

- **Display narrative** with proper formatting
- **Present choices** and handle player input
- **Track inventory** and game state
- **Save/load progress** at any point
- **Multiple book support** with a library system

### Book Format
Books are stored in a custom JSON-based format:

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

## Technical Implementation

### Architecture

The project follows a modular design:

- **Core engine**: Handles game logic and state
- **Editor module**: CLI interface for book creation
- **Player module**: CLI interface for playing books
- **Storage layer**: File I/O for books and saves

### Team Collaboration

Working in a team of 4, we used:

- **Git** for version control with a branching strategy
- **Task distribution** based on modules
- **Code reviews** before merging
- **Regular sync meetings** to coordinate

## Challenges

- **State management**: Tracking complex game states with conditions and inventory
- **User experience**: Making a terminal interface intuitive and enjoyable
- **Data validation**: Ensuring books are valid and playable before saving
- **Team coordination**: Integrating work from 4 developers smoothly

## What I Learned

- **Team collaboration** on a shared codebase
- **Git workflows** in a multi-developer environment
- **Modular design** for maintainable code
- **User-centered design** even in CLI applications
- **Documentation** to help teammates understand code
