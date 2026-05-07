---
draft: false
title: "Emi"
snippet: "Environmental Measures for Industries — a connected vest that tracks workers' health and environment in coal plants, plus a PHP OOP web platform to read live device data, manage workers, and run the community forum."
image:
  { src: "emi-banner.png", alt: "Emi workforce health monitoring case study" }
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

## Overview

**Emi — Environmental Measures for Industries.** A multifunction vest prototype designed for workers in French coal plants reopened during the 2022 European energy crisis. The vest measures air quality, ambient noise, body temperature, and heart rate while staying low-power and low-impact. Data flows over Bluetooth to a gateway, then to a web platform where managers monitor workers and a forum surfaces health alerts.

Built end-to-end during my APP electronics + software project at ISEP with team G10D (Hadouin LEROY, Romeo CORREC, Djamil ILA ADO, Gervais NGUEMA, Régis NGAN).

## System Architecture

```
Acquisition unit (vest)  ── Bluetooth ──▶  Gateway + server  ── HTTP ──▶  Web platform
```

- **CeMeQe** — Centrale de Mesure de Qualité Environnementale, built around the **TI TIVA TM4C123GH6PM** (256 KB flash, 80 MHz, 12-bit ADC, UART/I2C/SPI/PWM)
- **Sensors**: MiCS-VZ-89TE (CO₂ + tVOC), microphone front-end (mic + low/high-pass filter + amp), DHT11 (temperature + humidity), C503D-WAN IR LED + phototransistor (heart rate)
- **Display**: SSD1306 128×32 OLED over I2C
- **Comms**: HC-06 Bluetooth module on Serial1, ASCII frames to the gateway
- **Web**: PHP OOP MVC app, MariaDB, Apache, phpMyAdmin, Dockerized

## Hardware & Signal Chain

### Gas (CO₂ / tVOC)

The MiCS-VZ-89TE outputs a 30 Hz PWM where alternating 33.3 ms pulses encode tVOC (5–45 % duty) and CO₂ (55–95 % duty). The microcontroller reads pulse width, computes `(timeHIGH / pulseLength) * 100`, and demuxes the two channels.

### Sound

A three-stage analog chain on the mic signal: low-pass filter, op-amp gain stage, high-pass filter. Component values were sized in TINA, simulated for Bode response, then validated on the bench before feeding the ADC.

### Heart rate (ECG-style optical)

LED + phototransistor clamped on the finger. Blood pulses change finger opacity → phototransistor current swings. The MCU detects peaks above a voltage/duration threshold and converts inter-beat time to BPM with `60000 / Δt_ms`. Resting tests measured ~60–70 BPM, post-effort ~100–108 BPM.

### Skin temperature

DHT11 single-bus protocol: 40-bit frame (humidity int/dec, temperature int/dec, checksum). 4.7 kΩ pull-up keeps the open-collector line clean at 3.3 V; checksum byte gates the data.

### OLED logo

The SSD1306 displays the Emi logo and live state messages (transmitting, sensing, error). Confirms the board is alive without a serial console.

### Bluetooth frame format

ASCII frames carry group ID, sensor type, sensor index, value. Example for 25.8 °C: `1G10D13010258FFFFXX`. Frame types: *Courante* (sensor data), *Synchronisation*, *Rapide*.

## Web Platform — PHP OOP

[`hadouin/emi-website-oop`](https://github.com/hadouin/emi-website-oop) — strict MVC in vanilla PHP, no framework, to internalise OOP patterns end-to-end.

- **Controllers** — GET/POST routing per feature
- **Model**
  - `entities/` — domain classes (User, Device, Reading…)
  - Repository classes for SQL access
- **Templates** — views grouped by feature module
- **Stack** — PHP-Apache (port 80), MariaDB (3306), phpMyAdmin (8080), Docker Compose, `.env` for credentials

Features: landing, login, signup, live device dashboard, devices list, workers list, community forum.

## 2026 Design Refresh

Revisited the product as a design-system exercise: redrew the 7 core screens around a single token set (the **Nitro DS** experiment), with live-data gauges for the dashboard, a clean worker registry, and a calmer forum layout. Goal was to see how far the original 2022 product could be pushed visually without changing the underlying PHP architecture.

## What I Learned

- Specifying, simulating (TINA), and breadboarding a multi-sensor analog/digital front end
- Driving heterogeneous sensors (PWM, single-bus, I2C, analog) from one TIVA MCU under tight power budget (~100 mA → ~50 h on a 5000 mAh phone battery)
- Designing a frame protocol that survives noisy Bluetooth links
- Writing a full-stack PHP app from scratch in MVC to feel the patterns most frameworks hide
- Owning the loop from electronics → embedded C → wire protocol → backend → UI
