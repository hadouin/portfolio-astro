---
draft: false
title: "PonziLand"
snippet: "Multiplayer financial strategy game on Starknet. A 64,000+ parcel map rendered with Three.js, blockchain data synced in real time, SvelteKit frontend."
image:
  { src: "ponziland-display-full.png", alt: "PonziLand showcase" }
technos:
  [
    "SvelteKit",
    "Svelte",
    "TypeScript",
    "Three.js",
    "GLSL",
    "Starknet",
    "Cairo",
    "Dojo",
    "Rust",
    "PostgreSQL",
  ]
startDate: "2024-06-01 08:00"
endDate: "2099-02-01 00:00"
github: "https://github.com/RuneLabsxyz/PonziLand"
demo: "https://play.ponzi.land"
show: true
priority: 2
---

## Project context

PonziLand is a multiplayer financial strategy game built on the Starknet blockchain. Players buy, sell, and exploit virtual land parcels whose economic rules are enforced by smart contracts.

The challenge was making that complex infrastructure invisible to the player — an experience as smooth as a regular web app — while supporting a map of over 64,000 parcels and data updated in real time.

Landing page: [ponzi.land](https://ponzi.land). Play the game: [play.ponzi.land](https://play.ponzi.land).

## How the work unfolded

I took part in building the product end to end, with strong ownership of the frontend, the user experience, and performance.

Notably, I worked on:

- building the MVP in SvelteKit and TypeScript;
- designing the game's main interfaces and interactions;
- integrating smart contracts for purchases, sales, auctions, taxes, and transactions;
- real-time synchronization of blockchain data;
- setting up indexing and data-processing services;
- rebuilding and optimizing map rendering with Three.js, InstancedMesh, and GLSL;
- developing competitive and tournament features;
- optimizing the frontend architecture and data structures to keep the experience smooth at scale.

## Measurable impact

- **64,000+ parcels** managed and displayed in the game world
- Around **$100,000 in transaction volume**
- Certain data lookups optimized from **O(n) to O(1)**
- Tens of thousands of interactive elements rendered thanks to InstancedMesh and shaders
- Architecture spanning several technical layers: frontend, smart contracts, indexing, and database
- Product running in a multiplayer environment with real-time data synchronization

## Merch

I also designed merchandise for the project: hoodies and tees featuring original illustrations and the in-game land tiles.

![PonziLand merch lineup I designed](../../../assets/portfolio/ponziland-merch.png)

## Technologies

SvelteKit, Svelte 5, TypeScript, Three.js, GLSL, Starknet, Cairo, Dojo, Cartridge, Rust, PostgreSQL.
