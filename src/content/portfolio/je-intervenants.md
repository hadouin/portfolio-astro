---
draft: false
title: "JE Intervenants"
snippet: "Platform for Junior ISEP to connect alumni and industry experts with student project teams through a browsable expert directory."
image:
  { src: "/images/display/je-intervenants-banner.png", alt: "JE Intervenants platform banner" }
technos: ["Design Thinking", "UX Research", "Product Design", "Scrum", "Figma", "Notion", "CI/CD"]
startDate: "2024-01-01 00:00"
demo: "https://je-intervenants.juniorisep.com/"
---

## Overview

JE Intervenants is a platform built for Junior ISEP to make it easy for project teams to find the right alumni or industry expert when they need guidance. Instead of relying on personal networks and cold outreach, teams can browse a curated directory of intervenants, filter by expertise, and reach out directly.

## The Problem

Junior ISEP runs dozens of client projects each year. Teams often hit moments where they need domain expertise — a lawyer, a senior engineer, a marketing specialist — to unblock a deliverable or validate an approach. The existing process was informal: ask around, hope someone knows someone, waste days.

## Design Thinking Process

![Design thinking illustration](/images/display/je-intervenants-design-thinking.png)

The project started with a full design thinking pass:

- **Empathize** — interviews with project managers and former intervenants to understand friction on both sides
- **Define** — framed the core problem as a discovery and trust gap, not a contact database gap
- **Ideate** — explored directory, matching, and request-based flows before converging on a browsable directory with direct outreach
- **Prototype** — low-fi wireframes, then a hi-fi clickable prototype tested with real project teams
- **Test** — iteration based on feedback around filtering, expert profile depth, and contact flow

## Deliverables

- User research synthesis and personas
- Information architecture and flow diagrams
- Hi-fi prototype and design system
- Marketing assets including banners and coming-soon visuals
- Platform launch at [je-intervenants.juniorisep.com](https://je-intervenants.juniorisep.com/)

## Team Workflow

Shipping with a student team meant process mattered as much as design quality. We ran Scrum with short sprints, GitHub issues for tracking, and Figma as the single source of truth for specs. Each issue linked its Figma frame, so devs never implemented from stale screenshots. PR reviews referenced both the issue and the design file.

## Client Relationship Management

Client comms was the biggest bottleneck early on — scattered email threads, missed handoffs, unclear onboarding. Fixed by centralizing everything in Notion: one CRM database for intervenants and project contacts, onboarding automations that fire templated tasks and emails when a new expert signs up, and shared status views so the whole team sees where each relationship stands.

![Notion CRM illustration](/images/display/je-intervenants-notion-crm.png)

## Automated Releases

App releases used to be manual and skipped. Built a CI/CD pipeline that tags versions, ships builds, and auto-generates a devlog from commit history on every release. Zero extra work per ship, and stakeholders finally had a readable changelog.

## Launch

![JE Intervenants coming soon banner](/images/display/je-intervenants-coming-soon.png)

A coming-soon landing page was used to build anticipation inside the Junior ISEP community and collect early expert signups before the public launch.

## What I Learned

Design thinking pays off most when the obvious solution is wrong. The first instinct was "build a contact list." The real problem was trust and discoverability — which changed every downstream design decision, from profile fields to how outreach is framed.
