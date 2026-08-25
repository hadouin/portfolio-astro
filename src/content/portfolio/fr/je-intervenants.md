---
draft: false
title: "JE Intervenants"
snippet: "Plateforme pour Junior ISEP qui connecte alumni et experts du milieu professionnel aux équipes projet étudiantes via un annuaire d'experts navigable."
image:
  { src: "je-intervenants-banner.png", alt: "Bannière de la plateforme JE Intervenants" }
images:
  - { src: "je-intervenants-design-thinking.png", alt: "Atelier de design thinking" }
  - { src: "je-intervenants-notion-crm.png", alt: "CRM Notion des intervenants" }
technos: ["Design Thinking", "UX Research", "Product Design", "Scrum", "Figma", "Notion", "CI/CD"]
startDate: "2024-01-01 00:00"
demo: "https://je-intervenants.juniorisep.com/"
priority: 3
---

## Vue d'ensemble

JE Intervenants est une plateforme conçue pour Junior ISEP, qui permet aux équipes projet de trouver facilement le bon alumni ou expert métier au moment où elles en ont besoin. Plutôt que de s'appuyer sur des réseaux personnels et du cold outreach, les équipes parcourent un annuaire curé d'intervenants, filtrent par expertise et entrent directement en contact.

## Le problème

Junior ISEP gère des dizaines de projets clients par an. Les équipes tombent souvent sur des moments où il leur faut une expertise métier (un avocat, un ingénieur senior, un spécialiste marketing) pour débloquer un livrable ou valider une approche. Le process existant était informel : demander autour de soi, espérer que quelqu'un connaisse quelqu'un, perdre des jours.

## Démarche Design Thinking

![Illustration du design thinking](../../../assets/portfolio/je-intervenants-design-thinking.png)

Le projet a démarré sur une démarche complète de design thinking :

- **Empathize** : entretiens avec des chefs de projet et d'anciens intervenants pour comprendre les frictions des deux côtés
- **Define** : reformulation du problème central comme un manque de découverte et de confiance, et non comme un manque de carnet d'adresses
- **Ideate** : exploration de flux annuaire, matching et demande, avant de converger vers un annuaire navigable avec contact direct
- **Prototype** : wireframes basse fidélité, puis prototype haute fidélité cliquable testé avec de vraies équipes projet
- **Test** : itération à partir des retours sur le filtrage, la profondeur des profils et le flux de contact

## Livrables

- Synthèse de recherche utilisateur et personas
- Architecture de l'information et diagrammes de flux
- Prototype haute fidélité et design system
- Assets marketing : bannières et visuels coming-soon
- Lancement de la plateforme sur [je-intervenants.juniorisep.com](https://je-intervenants.juniorisep.com/)

## Workflow d'équipe

Livrer avec une équipe étudiante implique que le process compte autant que la qualité du design. On a tourné en Scrum avec des sprints courts, des issues GitHub pour le suivi, et Figma comme source de vérité unique pour les specs. Chaque issue était liée à sa frame Figma, pour que les devs ne codent jamais à partir de captures périmées. Les revues de PR référençaient à la fois l'issue et le fichier de design.

## Gestion de la relation client

La communication client était le plus gros goulet d'étranglement au début : threads d'emails éparpillés, passes manqués, onboarding flou. Réglé en centralisant tout dans Notion : une base CRM unique pour les intervenants et les contacts projet, des automations d'onboarding qui déclenchent des tâches et des emails templatés à chaque inscription d'expert, et des vues de statut partagées qui rendent visible à toute l'équipe l'avancement de chaque relation.

![Illustration du CRM Notion](../../../assets/portfolio/je-intervenants-notion-crm.png)

## Releases automatisées

Les releases d'app étaient manuelles et souvent oubliées. J'ai mis en place un pipeline CI/CD qui tague les versions, ship les builds et auto-génère un devlog à partir de l'historique de commits à chaque release. Zéro effort supplémentaire par livraison, et les parties prenantes ont enfin un changelog lisible.

## Lancement

![Bannière coming soon JE Intervenants](../../../assets/portfolio/je-intervenants-coming-soon.png)

Une landing page coming soon a été utilisée pour créer de l'attente dans la communauté Junior ISEP et collecter les premières inscriptions d'experts avant le lancement public.

## Ce que j'en ai tiré

Le design thinking paie le plus quand la solution évidente est mauvaise. Le premier réflexe était "construire un carnet d'adresses". Le vrai problème était la confiance et la découvrabilité, ce qui a changé toutes les décisions de design en aval, depuis les champs de profil jusqu'à la manière de cadrer la prise de contact.
