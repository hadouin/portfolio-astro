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

The challenge was making that complex infrastructure invisible to the player, with an experience as smooth as a regular web app, while supporting a map of over 64,000 parcels and data updated in real time.

Landing page: [ponzi.land](https://ponzi.land). Play the game: [play.ponzi.land](https://play.ponzi.land).

![PonziLand banner](../../../assets/portfolio/ponziland-banner.png)

The game loop comes down to three beats: buy a parcel by staking a token, collect taxes from neighbours, then flip it or hold.

![PonziLand game loop: buy, earn, flip or hold](../../../assets/portfolio/ponziland-gameplay-loop.png)

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

Interface work started in a Figma space shared with the team, where screens, the FTUE, and components were explored before being ported to code.

![Collaborative Figma design space for the project](../../../assets/portfolio/ponziland-figma.png)

Every token the game supports has its own building and upgrade tiers, which means dozens of sprites to integrate and render on the map.

![Variety of PonziLand buildings across supported tokens](../../../assets/portfolio/ponziland-buildings.png)

Rebuilding the renderer in Three.js replaced the DOM with InstancedMesh and GLSL shaders, with a live effect-tuning panel during development.

![PonziLand 3D scene with the outline shader tuning panel](../../../assets/portfolio/ponziland-threejs-scene.png)

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
