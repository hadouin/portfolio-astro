---
draft: false
title: "Emi"
snippet: "Environmental Measures for Industries — un gilet connecté qui suit la santé et l'environnement des ouvriers en centrale à charbon, plus une plateforme web PHP OOP pour lire les données live, gérer les ouvriers et animer le forum communautaire."
image:
  { src: "emi-banner.png", alt: "Étude de cas Emi : monitoring santé des ouvriers" }
technos:
  [
    "C",
    "Energia",
    "TIVA TM4C123",
    "Bluetooth",
    "Electronics",
    "TINA",
    "PHP",
    "OOP",
    "MVC",
    "MariaDB",
    "Docker",
    "Figma",
    "UI/UX",
  ]
startDate: "2022-09-01 00:00"
endDate: "2023-01-02 00:00"
github: "https://github.com/hadouin/emi-website-oop"
priority: 6
---

## Vue d'ensemble

**Emi — Environmental Measures for Industries.** Prototype de gilet multifonction conçu pour les ouvriers des centrales à charbon françaises rouvertes pendant la crise énergétique européenne de 2022. Le gilet mesure la qualité de l'air, le bruit ambiant, la température corporelle et le rythme cardiaque, tout en restant basse consommation et discret. Les données circulent en Bluetooth vers une passerelle, puis vers une plateforme web où les managers supervisent les ouvriers et où un forum fait remonter les alertes santé.

Conçu de bout en bout pendant mon projet APP électronique + logiciel à l'ISEP, avec l'équipe G10D (Hadouin LEROY, Romeo CORREC, Djamil ILA ADO, Gervais NGUEMA, Régis NGAN).

## Architecture système

```
Centrale d'acquisition (gilet)  ── Bluetooth ──▶  Passerelle + serveur  ── HTTP ──▶  Plateforme web
```

- **CeMeQe** — Centrale de Mesure de Qualité Environnementale, construite autour du **TI TIVA TM4C123GH6PM** (256 KB flash, 80 MHz, ADC 12 bits, UART/I2C/SPI/PWM)
- **Capteurs** : MiCS-VZ-89TE (CO₂ + tVOC), front-end micro (micro + filtre passe-bas/passe-haut + amp), DHT11 (température + humidité), LED IR C503D-WAN + phototransistor (rythme cardiaque)
- **Affichage** : OLED SSD1306 128×32 en I2C
- **Comms** : module Bluetooth HC-06 sur Serial1, trames ASCII vers la passerelle
- **Web** : app PHP OOP MVC, MariaDB, Apache, phpMyAdmin, Dockerisée

## Hardware & chaîne de signal

### Gaz (CO₂ / tVOC)

Le MiCS-VZ-89TE sort un PWM 30 Hz où les impulsions alternées de 33,3 ms encodent les tVOC (5–45 % rapport cyclique) et le CO₂ (55–95 %). Le microcontrôleur lit la largeur d'impulsion, calcule `(timeHIGH / pulseLength) * 100`, puis démultiplexe les deux canaux.

### Son

Chaîne analogique en trois étages sur le signal du micro : filtre passe-bas, étage de gain à amp-op, filtre passe-haut. Les valeurs des composants ont été dimensionnées sous TINA, simulées (réponse de Bode), puis validées au banc avant attaque de l'ADC.

### Rythme cardiaque (optique type ECG)

LED + phototransistor pincés sur le doigt. Les pulsations sanguines modifient l'opacité du doigt → le courant du phototransistor varie. Le MCU détecte les pics au-dessus d'un seuil de tension/durée et convertit le temps inter-battements en BPM via `60000 / Δt_ms`. Tests au repos : ~60–70 BPM, après effort : ~100–108 BPM.

### Température cutanée

Protocole single-bus DHT11 : trame 40 bits (humidité int/déc, température int/déc, checksum). Une pull-up 4,7 kΩ garde la ligne open-collector propre à 3,3 V ; la checksum filtre la donnée.

### Logo OLED

Le SSD1306 affiche le logo Emi et les messages d'état (transmission, mesure, erreur). Confirme que la carte est en vie sans console série.

### Format des trames Bluetooth

Les trames ASCII transportent l'ID groupe, le type de capteur, l'index capteur et la valeur. Exemple pour 25,8 °C : `1G10D13010258FFFFXX`. Types de trames : *Courante* (données capteur), *Synchronisation*, *Rapide*.

## Plateforme web — PHP OOP

[`hadouin/emi-website-oop`](https://github.com/hadouin/emi-website-oop) — MVC strict en PHP vanilla, sans framework, pour internaliser les patterns OOP de bout en bout.

- **Controllers** — routage GET/POST par feature
- **Model**
  - `entities/` — classes domaine (User, Device, Reading…)
  - Classes Repository pour l'accès SQL
- **Templates** — vues regroupées par module fonctionnel
- **Stack** — PHP-Apache (port 80), MariaDB (3306), phpMyAdmin (8080), Docker Compose, `.env` pour les credentials

Fonctionnalités : landing, login, signup, dashboard live device, liste des appareils, liste des ouvriers, forum communautaire.

## Refonte design 2026

J'ai retravaillé le produit comme un exercice de design system : 7 écrans clés redessinés autour d'un seul jeu de tokens (l'expérimentation **Nitro DS**), avec des jauges live pour le dashboard, un registre des ouvriers épuré, et une mise en page de forum plus calme. L'objectif était de voir jusqu'où le produit original de 2022 pouvait être poussé visuellement sans toucher à l'architecture PHP.

## Ce que j'en ai tiré

- Spécifier, simuler (TINA) et prototyper sur breadboard un front-end analogique/numérique multi-capteurs
- Piloter des capteurs hétérogènes (PWM, single-bus, I2C, analogique) depuis un seul MCU TIVA sous contrainte de consommation (~100 mA → ~50 h sur batterie 5000 mAh)
- Concevoir un protocole de trame qui survit à un lien Bluetooth bruité
- Écrire une app full-stack PHP de zéro en MVC pour ressentir les patterns que la plupart des frameworks masquent
- Maîtriser la boucle complète : électronique → C embarqué → protocole sur fil → backend → UI
