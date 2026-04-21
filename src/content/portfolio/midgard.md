---
draft: false
title: "Midgard"
snippet: "Factory/challenge game system built on Starknet. SvelteKit 5 application where players create factories, stake GARD tokens, and compete through challenges"
image:
  { src: "/images/display/midgard-display-full.jpg", alt: "Midgard showcase" }
technos: ["SvelteKit", "Svelte 5", "TypeScript", "PostgreSQL", "Drizzle", "Starknet", "TailwindCSS"]
startDate: "2025-01-01 08:00"
endDate: "2099-03-01 00:00"
github: "https://github.com/hadouin/midgard-website-svelte"
show: false
---

## Overview

Midgard is a factory/challenge game system built on Starknet. Players called "Tycoons" create factories on land parcels, staking GARD tokens. Other players can challenge these factories by competing in mini-games like Flappy Bird. Winners take the stakes.

## My Role

I develop Midgard as a full-stack SvelteKit 5 application:

- **Frontend**: Building reactive UI with Svelte 5 runes and TailwindCSS 4
- **Backend**: Server routes and API endpoints for game logic
- **Database**: Designing and managing PostgreSQL schema with Drizzle ORM
- **Blockchain Integration**: Connecting to Starknet for wallet and token operations

## Technical Challenges

### Svelte 5 Migration

Working with Svelte 5's new runes system ($state, $derived, $effect) required adapting patterns from Svelte 4 stores. The new reactivity model is more explicit but demanded rethinking component architecture.

### Token Economics

Implementing GARD token mechanics (minting, burning, locking) while keeping the game balanced. Factory stakes and challenge rewards needed careful tuning.

### Real-time Game State

Synchronizing game state between the database, blockchain, and client. Challenges have time limits and expiration that need accurate tracking.

## Key Features

- **Factory System**: Tycoons stake GARD to create factories on parcels
- **Challenge Mechanics**: Players compete through mini-games to win stakes
- **GARD Token**: In-game currency with mint, burn, and lock functionality
- **Wallet Integration**: Starknet wallet connection via @runelabsxyz/ponziland-account
- **Statistics Dashboard**: Track player performance with layerchart visualizations

## What I Learned

Midgard expanded my skills in:

- Svelte 5 runes and modern reactive patterns
- Drizzle ORM for type-safe database operations
- Game economy design and token mechanics
- Building competitive multiplayer systems on blockchain
