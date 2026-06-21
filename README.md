# ⚡ DeployPulse

### Keep Your Apps Alive — Uptime Monitoring & Keep-Alive SaaS for Indie Developers

A production-oriented full-stack SaaS that **continuously pings your free-tier apps to prevent sleep, monitors uptime, and alerts you via Email and Slack when things break.**

This project focuses on **real-world deployment monitoring, background job processing, multi-channel alerting, Stripe payments, and polished UX** — not just HTTP pings.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

[![Status](https://img.shields.io/website?url=https%3A%2F%2Fdeploypulse.64.226.124.118.nip.io&label=Live%20Demo)](https://deploypulse.64.226.124.118.nip.io)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🎯 Project Purpose

Free-tier hosting platforms (Render, Railway, Heroku) put apps to sleep after 15 minutes of inactivity — causing cold starts, timeouts, and embarrassing customer complaints.

**DeployPulse** addresses this by:

- sending periodic HTTP requests to your deployed apps to prevent sleep
- monitoring uptime percentages and response times 24/7
- detecting downtime instantly and alerting you via Email and Slack
- tracking incident history so you know exactly when and why outages occurred
- offering paid plans (Starter / Pro) with Stripe integration for monetization

The project was built to be both a **production-ready SaaS** and a **strong full-stack portfolio piece**.

---

## 🚀 Core Features

### Keep Alive

- Periodic HTTP pings to prevent Render / Railway / Heroku free-tier sleep
- Configurable interval (1 min to 1 hour)
- Pulsing status indicator on dashboard cards
- Distinct purple-themed UI for Keep Alive monitors

### Uptime Monitoring

- Full Monitoring mode with UP / DOWN / PENDING status tracking
- Response time measurement in milliseconds
- Uptime percentage calculation (24h, 7d, 30d)
- Custom SVG response time charts with period toggles

### Incident Tracking & Alerting

- Automatic incident creation on status transitions (UP → DOWN)
- Incident timeline with duration display (e.g., "2h 15m outage")
- Email alerts via Gmail SMTP (Nodemailer) with branded HTML templates
- Slack alerts via Incoming Webhooks with Block Kit formatting
- Per-monitor channel toggles (Email / Slack)
- Alert preferences in Settings with test-alert capability

### Dashboard & Analytics

- Auto-refreshing dashboard (every 15s) with real-time status updates
- Stats bar: Total / Up / Down / Pending monitor counts
- Compact monitor cards with "Checked X ago" timestamps
- Plan badge with monitor limit counter
- Page transitions and card animations via Framer Motion
- Dark mode with system preference detection

### Stripe Payments & Plan Management

- 3-tier pricing: Free (3 monitors) / Starter ($5/mo, 25 monitors) / Pro ($15/mo, 100 monitors)
- Stripe Checkout integration with Customer Portal for subscription management
- Webhook handler for automatic plan upgrades and downgrades
- Plan limits enforced on monitor count, check interval, and history retention
- Dynamic pricing cards with current-plan detection on landing page
- Polished plan upgrade/downgrade email notifications

### Landing Page

- Animated heartbeat SVG hero with shifting gradient background
- Scroll-reveal feature cards with Framer Motion
- Pricing cards with hover elevation effects
- Live demo CTA for authenticated users
- Tech stack badges in footer

---

## 🌐 Live Demo

**https://deploypulse.64.226.124.118.nip.io**

> ⚠️ Note: This is a self-hosted portfolio deployment on a $6/mo DigitalOcean VPS.
> The app runs 24/7 — no cold starts, no inactivity sleep.

---

## 🖼️ Screenshots

### 1️⃣ Landing Page — Hero & Features

![Landing Page](views/Screenshot%202026-06-20%20230443.png)
![Landing Page](views/Screenshot%202026-06-20%20230459.png)

### 2️⃣ Landing Page — Dark Mode & Pricing

![Landing Dark](views/Screenshot%202026-06-20%20230508.png)

### 3️⃣ Dashboard — Monitors, Stats Bar & Plan Badge

![Dashboard](views/Screenshot%202026-06-20%20230609.png)

### 4️⃣ Create Monitor — Dialog with Mode Toggle

![Create Monitor](views/Screenshot%202026-06-21%20021856.png)
![Create Monitor](views/Screenshot%202026-06-21%20021905.png)

### 5️⃣ Monitor Detail — Charts, Uptime & Incidents

![Monitor Detail](views/Screenshot%202026-06-21%20022221.png)
![Monitor Detail](views/Screenshot%202026-06-21%20022234.png)

### 6️⃣ Settings — Billing Tab with Plan Cards

![Settings Billing](views/Screenshot%202026-06-21%20022025.png)

### 7️⃣ Settings — Notifications Tab

![Settings Notifications](views/Screenshot%202026-06-21%20052045.png)

### 8️⃣ Mobile Dashboard

![Mobile Dashboard](views/Screenshot%202026-06-21%20022455.png)

---

## 🏗️ Architecture Overview

The application follows a layered architecture with background job processing:

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│          React 19 + Vite + Tailwind              │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────┐
│              Caddy Reverse Proxy                 │
│          Auto-SSL via Let's Encrypt              │
└────────┬───────────────────────────┬────────────┘
         │ /api/*                     │ /*
┌────────▼──────────┐      ┌─────────▼──────────┐
│  Express API      │      │  Nginx (Static)    │
│  TypeScript       │      │  Vite Build        │
│  Prisma ORM       │      └────────────────────┘
└───┬───────┬───────┘
    │       │
┌───▼───┐ ┌─▼──────┐    ┌──────────────────────┐
│ Post- │ │ Redis  │    │  BullMQ Worker        │
│ greSQL│ │        │    │  HTTP Check Fetcher   │
│       │ │        │◄───│  Incident Detector    │
└───────┘ └─┬──────┘    │  Alert Dispatcher     │
            │            └──────────┬───────────┘
            │                       │
            │  ┌────────────────────▼───────────┐
            │  │  Scheduler (every 15s)         │
            │  │  • Queries all monitors        │
            └──┤  • Checks if ping is due       │
               │  • Enqueues check jobs         │
               └────────────────────────────────┘
```

### Key Layers

**Client Layer (React + Vite)**

- shadcn/ui component library with CSS variables for theming
- React Query for server-state caching with 15s auto-refetch
- Framer Motion for page transitions and card animations
- Sonner for toast notifications
- Custom SVG charts for response time visualization
- Mobile-responsive layout with hamburger navigation

**API Layer (Express + TypeScript)**

- 20 RESTful endpoints across auth, monitors, billing, user settings, and webhooks
- JWT authentication middleware with plan-limit enforcement
- Service-layer architecture separating business logic from route handlers
- Shared error handling via centralized `AppError` class

**Background Processing (BullMQ + Redis)**

- Scheduler enqueues check jobs based on per-monitor intervals
- Worker processes jobs with 10-second timeout and concurrency control
- Batch-optimized query (single `groupBy` instead of N+1 `findFirst`)
- Overlap guard prevents concurrent scheduler ticks

**Data Layer (PostgreSQL + Prisma)**

- 5 models: User, Monitor, Check, Alert, Incident
- Cascading deletes with indexed query paths
- Enum arrays for notification channels
- Plan-based history retention clamping

**Infrastructure (Docker + Caddy)**

- 5 Docker services: PostgreSQL, Redis, Backend, Frontend, Caddy
- Multi-stage Docker builds (TypeScript compilation → slim Node runner)
- Caddy reverse proxy with automatic Let's Encrypt SSL
- DigitalOcean VPS deployment ($6/mo)

---

## 🔄 Monitoring Pipeline

1. **User creates a monitor** via the dashboard (Keep Alive or Full Monitoring mode)
2. **Scheduler** queries all monitors every 15 seconds, checks if each is due for a ping
3. **BullMQ Queue** receives check jobs with monitor URL, name, and mode
4. **Worker** fetches the URL with a 10-second timeout, measures response time
5. **Result is saved** — Check record created, Monitor status updated (UP / DOWN)
6. **Incident detection** — if status transitions UP → DOWN, an Incident is created and an alert is dispatched via Email and/or Slack
7. **Dashboard auto-refreshes** — React Query refetches every 15 seconds, status dots pulse

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| shadcn/ui | Component library (Button, Card, Dialog, Input, Badge, Tabs, Tooltip) |
| React Query (TanStack) | Server-state management & auto-refetch |
| React Router 7 | Client-side routing |
| Framer Motion | Page transitions & card animations |
| Sonner | Toast notifications |
| Axios | HTTP client with JWT interceptor |
| next-themes | Dark mode with system detection |

### Backend

| Technology | Purpose |
|-----------|---------|
| Node.js 22 | Runtime |
| Express 5 | HTTP framework |
| TypeScript 5 | Type safety |
| Prisma 7 | ORM (PostgreSQL adapter) |
| BullMQ | Job queue for background checks |
| Stripe | Payment processing & subscription management |
| Nodemailer | Email alerts via Gmail SMTP |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| jsonwebtoken + bcryptjs | Authentication |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 17 | Primary database |
| Redis 7 | Job queue & caching |
| Docker + Docker Compose | Containerization |
| Caddy | Reverse proxy + auto-SSL |
| Nginx | Static frontend serving |
| DigitalOcean | VPS hosting ($6/mo) |
| Let's Encrypt | SSL certificates |

---

## 🔒 Security Considerations

- JWT authentication with production-only secret enforcement (fails fast if unset)
- CORS restricted to configured frontend origin
- Rate limiting: 20 req/15min on auth endpoints, 500 req/15min globally
- Input validation with length limits on all user-supplied fields (name ≤255, URL ≤2048, email ≤255, password 6-128)
- HTML entity escaping on all email and Slack notification templates (XSS prevention)
- Helmet middleware for security headers (CSP, X-Frame-Options, HSTS)
- `x-powered-by` disabled, trust proxy configured
- Request body size limit (1MB)
- Server timeout (30 seconds)
- Stripe webhook signature verification
- Redis connection retry limits (3 retries, 5 max failures)
- Plan-based access control (monitor count, minimum interval, history retention)

---

## ▶️ Running Locally

### 1️⃣ Start Infrastructure

```bash
docker compose up -d
```

### 2️⃣ Backend

```bash
cd backend
npm install
npm run dev          # Express API on port 3000 (tsx watch)
npx prisma db push   # Apply database schema
```

### 3️⃣ Frontend

```bash
cd frontend
npm install
npm run dev          # Vite dev server on port 5173
```

Open `http://localhost:5173` — the app is fully functional with Docker PostgreSQL + Redis.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (64-char hex) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry |
| `SMTP_HOST` | No | — | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | Email address |
| `SMTP_PASS` | No | — | Gmail app password |
| `ALERT_FROM_EMAIL` | No | — | From email for alerts |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER_ID` | No | — | Starter plan price ID |
| `STRIPE_PRICE_PRO_ID` | No | — | Pro plan price ID |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend origin for CORS |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `VITE_API_URL` | No | `/api` | API base URL (set to `http://localhost:3000/api` for local dev) |

---

## 🌱 Future Improvements

- Public status pages (`status.company.com`) for SaaS businesses
- SSL certificate expiry monitoring
- Cron job heartbeat monitoring
- WhatsApp alerts via Twilio
- Team member invitations
- Mobile PWA with push notifications
- AI-powered anomaly detection for response times
- WebSocket-based real-time dashboard updates
- Migration from JWT localStorage to httpOnly cookies

---

## 👤 Author Note

Built with a production mindset, focusing on **real-world deployment monitoring, background job processing, multi-channel alerting, and Stripe payments** — rather than simple HTTP pings.

This project demonstrates applied full-stack SaaS architecture with **secure authentication, payment integration, polished UX, and production Docker deployment** — reflecting real engineering scenarios beyond basic CRUD applications.

---

Built by [Mihail Todorov](https://github.com/Misho-1019)
