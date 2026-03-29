# Novua Inbox — Recover Lost Revenue with AI

Most businesses do not lose deals because of lack of demand.  
They lose them because leads are not handled fast or consistently enough.

## Live Links

- Live Demo: https://ai-ops-inbox-one.vercel.app
- GitHub: https://github.com/iveteamorim/ai-ops-inbox
- Architecture: https://github.com/iveteamorim/ai-ops-inbox/blob/main/docs/architecture.svg

## Problem

Businesses lose revenue when leads are not answered fast enough, follow-ups are missed, and conversations across channels become inconsistent or fragmented.

This creates:

- lost deals from delayed response
- poor follow-up on warm leads
- missed high-value opportunities
- limited visibility into revenue at risk

## Solution

Novua Inbox combines a unified operations inbox with AI-assisted lead prioritization, response support, and revenue-aware follow-up workflows.

## How it Works

1. A lead enters through WhatsApp, email, or form
2. AI classifies urgency and intent
3. High-value leads are prioritized
4. Suggested replies are generated
5. Follow-up actions can be triggered based on inactivity

All activity is translated into operational and revenue impact.

## Business Impact

- reduce response time by 60-80%
- recover revenue from missed or delayed lead handling
- automate follow-up on conversations with buying intent
- improve visibility into pipeline and revenue at risk

## Revenue Layer

Novua Inbox is built around commercial impact, not just message management.

It highlights:

- high-value conversations
- at-risk revenue
- response urgency
- follow-up opportunities
- recovered vs potential value

## Why Novua Inbox

Unlike traditional CRMs or generic chat tools, Novua Inbox is built around revenue impact:

- not just messages, but money at risk
- not just replies, but conversion outcomes
- not just automation, but recovery workflows

## Architecture

- Next.js (App Router + API routes)
- Supabase (PostgreSQL, Auth, Row-Level Security)
- OpenAI (classification, scoring, response generation)

Core flows:

- message ingestion -> classification -> lead scoring
- priority queue generation based on business value
- inactivity-based follow-up triggers
- revenue estimation per conversation

![Architecture](docs/architecture.svg)

## AI Layer

- lead scoring (high / medium / low intent)
- context-aware reply suggestions
- revenue-at-risk estimation per conversation
- follow-up trigger detection based on inactivity

Goal:

Turn raw conversations into prioritized revenue actions.

## Technical Highlights

- Multi-tenant access boundaries and company-scoped message flows
- Signed webhook validation for WhatsApp ingestion
- Hardened auth/session flows and production-ready middleware guards
- Type-safe Next.js + Supabase implementation with linted CI-friendly structure

## Core Stack

- Frontend: Next.js (App Router)
- Backend: Next.js Route Handlers / API routes
- Database: Supabase (Postgres)
- AI: OpenAI API
- Integrations: WhatsApp Cloud API (scaffolded), email/form flows

## Project Structure

- `src/app` - pages, routes, and API handlers
- `src/components` - UI and i18n components
- `src/lib` - auth, i18n, Supabase, messaging, utilities
- `public` - static assets and screenshots
- `db` - schema and SQL assets
- `docs-messaging.md` - webhook and message flow notes

## Current Status

- Landing, pricing UX, and product narrative implemented
- Inbox, conversation, dashboard, revenue, and settings views implemented
- i18n support (ES/PT/EN)
- Currency detection with regional behavior (EUR/BRL) and manual override
- WhatsApp webhook and message persistence scaffolding included

## Screenshots

### Inbox Demo

![Inbox Demo](https://raw.githubusercontent.com/iveteamorim/ai-ops-inbox/main/public/screenshots/inbox-demo.png)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

4. Open:

- `http://localhost:3000`

## Environment Variables

Required for full auth/data behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional for webhook/admin flows:

- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `OPENAI_API_KEY`

If Supabase env vars are missing, protected routes stay locked and auth actions return configuration errors.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint checks

## Next Steps

- Connect real Supabase project for production auth and persistence
- Connect Stripe billing and trial lifecycle
- Connect production WhatsApp Cloud API credentials
