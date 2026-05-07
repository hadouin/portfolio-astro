---
draft: false
title: "LinkMeal"
snippet: "Linkmeal is the application that fights against food waste and student poverty by allowing students to exchange uneaten meals"
image: { src: "linkmeal-display.png", alt: "Linkmeal showcase" }
technos: ["ReactNative", "Symfony", "UI/UX", "JavaScript"]
startDate: "2020-02-01 00:00"
endDate: "2020-06-08 00:00"
github: "https://github.com/hadouin/LinkMeal"
priority: 6
---

## The Problem

Food waste is a massive issue, especially in university settings. At the same time, many students struggle with food insecurity. LinkMeal was born from the idea of connecting these two problems into one solution.

## The Solution

LinkMeal is a mobile application that allows students to share their unused meal credits or leftover food with other students. The app creates a community-driven approach to reducing food waste while helping students in need.

## Features

### For Donors
- Post available meals or meal credits
- Set pickup times and locations
- Track donation history
- Receive notifications when meals are claimed

### For Recipients
- Browse available meals nearby
- Request meals with one tap
- Coordinate pickup with donors
- Rate and thank donors

### Community Features
- Campus-specific communities
- Leaderboards for top donors
- Impact statistics (meals saved, waste reduced)

## Technical Implementation

### Mobile App (React Native)
The frontend was built with React Native to ensure a smooth experience on both iOS and Android. Key technical decisions included:

- **Redux** for state management
- **React Navigation** for seamless screen transitions
- **Push notifications** for real-time meal alerts
- **Geolocation** for nearby meal discovery

### Backend (Symfony)
The API was built with Symfony, providing:

- RESTful API endpoints
- User authentication and authorization
- Database management with Doctrine ORM
- Real-time notifications via WebSockets

## My Contributions

As part of the development team, I was responsible for:

- Designing the **UI/UX** of the mobile application
- Implementing frontend features in React Native
- Collaborating on API design and integration
- User testing and iterating based on feedback

## Challenges Overcome

- **Real-time coordination**: Ensuring donors and recipients could communicate effectively
- **Trust and safety**: Building features to verify users and ensure safe exchanges
- **Adoption**: Creating an intuitive onboarding experience to grow the user base

## Impact

During our pilot phase, LinkMeal helped redistribute dozens of meals that would have otherwise gone to waste, demonstrating the viability of peer-to-peer food sharing among students.
