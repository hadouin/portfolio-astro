---
draft: false
title: "Checklist Cycles : rendus rapides dans Blender"
snippet: "Mes réglages Cycles pour des rendus rapides : GPU compute, sampling, optimisations performance et format de sortie."
image:
  {
    src: "/blog/cycles-fast-renders/donut.mp4",
    alt: "Rendu donut Blender Cycles",
  }
publishDate: "2026-04-21 10:00"
category: "Tutoriels"
author: "Hadouin"
tags: [blender, cycles, 3d, rendering]
---

Une checklist courte que je passe avant de lancer un rendu Cycles. Rien d'extraordinaire, juste les réglages qui me donnent constamment le meilleur compromis vitesse/qualité.

<video src="/blog/cycles-fast-renders/donut.mp4" autoplay muted loop playsinline class="w-full rounded-md"></video>

## GPU Compute

Mettre le device de rendu sur **GPU Compute**. Le CPU ne vaut le coup que si vous n'avez pas de GPU utilisable.

![Réglage GPU compute dans Cycles](/blog/cycles-fast-renders/gpu-compute.png)

## Sampling (Render)

Garder le viewport rapide, garder le rendu final propre.

- **Noise Threshold** : `0.0500`
- **Max Samples** : `128`
- **Denoise**
  - Device : **GPU**
  - Quality : **High**

![Réglages de sampling et denoise](/blog/cycles-fast-renders/sampling.png)

## Performance

Deux toggles qui paient :

- **Spatial Splits** : on (traversée BVH plus rapide sur les scènes à gros polygones)
- **Persistent Data** : on (évite de re-syncer la scène entre frames quand on rend une animation)

![Réglages performance](/blog/cycles-fast-renders/performance.png)

## Sortie

Pour les animations, je rends en séquence EXR puis j'encode plus tard avec FFmpeg. Ça reste assez lossless et permet de recomposer sans relancer le rendu.

- **Format** : OpenEXR
- **Color** : RGB
- **Depth** : Float (Half)
- **Codec** : DWAA (lossy)
- **Resolution** : 50 %

![Réglages de sortie](/blog/cycles-fast-renders/output.png)

## Encode avec FFmpeg

Une fois la séquence EXR rendue, on la transforme en mp4. L'EXR est en linéaire HDR, donc il faut appliquer un tonemap et convertir en bt709 / yuv420p pour une compatibilité large.

```bash
ffmpeg -framerate 24 -start_number 1 -i render_%04d.exr \
  -vf "zscale=transfer=linear,tonemap=hable,zscale=transfer=bt709:matrix=bt709:primaries=bt709,format=yuv420p" \
  -c:v libx264 -crf 18 -preset slow \
  -movflags +faststart \
  out.mp4
```

Ajustez `%04d` selon le padding de frame de Blender, `-framerate 24` à votre fps, et `-start_number` à votre première frame.

C'est tout. Render.
