---
draft: false
title: "Deep Trading"
snippet: "End-to-end algo trading platform: backtest strategies on historical data, review Sharpe and equity curves, then deploy live bots with risk guardrails — plus a strategy marketplace. Built on SvelteKit with Alpaca market integration."
image:
  { src: "deep-trading-banner.png", alt: "Deep Trading platform feature graphic" }
technos:
  [
    "SvelteKit",
    "TypeScript",
    "Supabase",
    "TailwindCSS",
    "Alpaca API",
    "Python",
    "Docker",
    "Playwright",
  ]
startDate: "2024-03-01 00:00"
endDate: "2098-06-30 00:00"
github: "https://github.com/deep-trading-isep/Deep-Trading"
demo: "https://deeptrading.app"
show: true
priority: 4
---

## Overview

Deep Trading is a full-stack algorithmic trading platform I helped build at ISEP. It covers the strategy lifecycle end to end: configure a bot, backtest on historical data, review performance metrics, deploy to live markets, and monitor positions in real time. A marketplace lets users discover and adopt community strategies with transparent track records.

Live at [deeptrading.app](https://deeptrading.app). Source on [GitHub](https://github.com/deep-trading-isep/Deep-Trading).

## Production algo patterns

The same problems show up in any serious algo platform: turning market data into repeatable decisions, validating strategies before capital is at risk, and executing with strict guardrails. Deep Trading was my first time building that loop as a product:

- **Backtest → review → go live**: strategies are validated on historical data before deployment; performance charts and Sharpe ratio help decide whether to promote a bot to production
- **Strategy logic separated from execution**: parameterized Python bots (risk tolerance, position sizing, signal thresholds) run independently from the SvelteKit platform that handles auth, funding, order routing, and telemetry
- **Risk guardrails baked in**: per-bot capital allocation, max trade size, leverage caps, and risk-per-trade limits — trades only fire inside those bounds
- **Real-time telemetry**: live P/L, win rate, Sharpe ratio, cumulative equity curves, and recent transaction history on every active bot
- **Strategy marketplace**: browse, compare, and adopt pre-built strategies with published performance — a discovery layer on top of the execution stack

## My Role

Top contributor on a five-person team (#1 by commits). I owned a large share of the platform layer:

- **Trading dashboards**: bot detail views, portfolio overview, market data screens, and trade history
- **Broker integration**: Alpaca API end to end — account linking, ACH funding, transfers, live quotes, and order placement
- **Marketplace & backtesting flows**: strategy browsing, performance comparison, and the path from backtest results to live deployment
- **Platform backend**: SvelteKit server routes, Supabase auth, user roles (trader / seller / admin)
- **Bot runtime**: Python strategy scripts and Docker Compose for local dev and orchestration

## Key Features

- **Parameterized bots**: configure allocated capital, risk per trade, leverage, target markets (e.g. NASDAQ-100), and signal sensitivity — each bot runs as an isolated strategy instance
- **Backtesting**: run strategies against historical data and inspect outcomes before committing real capital
- **Live execution & monitoring**: active bots stream performance metrics, equity curves, and a full transaction log
- **Marketplace**: discover community strategies with return %, win rate, and equity curves; adopt or purchase strategies to deploy on your account
- **Portfolio & funding**: unified view of positions, market data, and account funding across the platform

## Stack

SvelteKit + TypeScript frontend and server, Supabase for auth and persistence, Alpaca Trade API for brokerage and market data, Python for strategy logic, Docker Compose for local orchestration. Playwright and Vitest for integration and unit tests.

## What I Learned

- How to design the **strategy lifecycle** as a product surface: backtest, compare metrics, promote to live, monitor — not just ship a chart
- Integrating a **brokerage API** under real constraints: auth, funding rails, order placement, and market data latency
- Building **risk-first UX**: surfacing Sharpe, win rate, and drawdown so users can reason about strategies before deploying capital
- Separating **strategy logic from platform execution** — the same architectural split used in production algo systems where signals, state, and order routing live in distinct layers
