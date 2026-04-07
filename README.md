# Novua Inbox

Novua Inbox is a conversation operations workspace focused on three things:

- commercial risk
- response ownership
- next action

It is not a CRM. It is an inbox-first operating layer for teams that manage inbound conversations, especially WhatsApp-style leads.

## What the product does

Novua Inbox helps a team answer a practical question:

> Which conversation needs attention now, who owns it, and how much money is at risk if we do nothing?

The current product is built around:

- an action-oriented inbox
- conversation ownership on first human reply
- lightweight multi-agent protection
- revenue visibility per conversation
- a settings area that defines how the workspace interprets the business

## Product model

### Inbox

The inbox is the main operating view.

It shows conversations as decision cards instead of table rows, with emphasis on:

- `En riesgo`
- `Nuevo`
- `En conversación`
- `Ganado`
- `Perdido`

Each card highlights:

- current state
- response delay
- estimated value
- assignment
- next action

### Conversation ownership

New conversations are not manually distributed one by one.

The current rule is:

- a conversation is claimed by the first agent who replies
- once claimed, ownership remains on that conversation
- owner/admin can bulk reassign open conversations from one agent to another

To reduce duplicate replies:

- the UI refreshes periodically
- the backend blocks a second agent from replying if another agent already claimed the conversation

### Dashboard

The dashboard is not a reporting screen.

It is meant to answer:

- what money is at risk now
- what is currently active
- what should the team do next

### Revenue

The revenue view is oriented around:

- money at risk now
- open pipeline value
- recently recovered value
- immediate actions required

For agents, the view is more tactical.
For owner/admin, it is broader across the workspace.

### Settings

The settings area is organized around:

- channel status
- how Novua prioritizes work
- who answers customers
- business setup and lead values

This is where the workspace defines the lead types and estimated values used throughout the app.

## Roles

### Owner

Can:

- manage the workspace
- invite/remove users
- reassign conversations in bulk
- edit business setup
- operate conversations

### Admin

Can:

- manage team and business setup
- operate conversations
- reassign conversations in bulk

### Agent

Can:

- work the inbox
- reply to conversations
- see system state
- report issues

Agent settings are intentionally reduced compared to owner/admin.

## Current stack

- `Next.js` App Router
- `React 19`
- `Supabase` for auth and data
- `Vercel` for deployment
- optional `OpenAI` integration for reply suggestions

## Local setup

### Requirements

- Node.js `>= 20`
- Supabase project with auth + database configured

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

App runs at:

```text
http://localhost:3000
```

### Lint

```bash
npm run lint
```

## Environment variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Required for admin/server actions

- `SUPABASE_SERVICE_ROLE_KEY`

### Optional internal workspace controls

- `NOVUA_INTERNAL_EMAILS`
- `NOVUA_INTERNAL_DOMAINS`

### Optional WhatsApp / Instagram webhook setup

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `INSTAGRAM_VERIFY_TOKEN`
- `INSTAGRAM_APP_SECRET`

### Optional AI reply suggestions

- `OPENAI_API_KEY`

If `OPENAI_API_KEY` is missing, the app falls back to deterministic suggestion behavior in the UI and the API route returns the expected "not configured" response path.

## Project structure

- `src/app` – routes, pages, API endpoints
- `src/components` – UI and workflow components
- `src/lib` – app data, auth, i18n, internal-access, scoring logic
- `public` – static assets
- `docs` – supporting documentation

## Operational behavior worth knowing

### Assignment visibility

A conversation is only treated as truly assigned in the UI once there is a human reply signal.

This avoids showing ownership too early on untouched conversations.

### Multi-agent safety

The app uses two layers:

- periodic refresh in inbox and conversation views
- backend claim check before sending a reply

That means visual updates are near-real-time, while the real protection is enforced server-side.

### Demo seeding

The repo includes demo-oriented flows for business setup and reseeding.
Those are useful for walkthroughs, but they should be treated as demo tooling, not final production onboarding architecture.

## What is already strong

- inbox-first workflow
- risk + money + action framing
- multi-role separation
- conversation ownership model
- action-oriented conversation and revenue views

## What is still early

- full production hardening
- webhook retry/idempotency maturity
- observability depth
- polished business setup UX compared to inbox quality
- full i18n cleanup in every corner of the app

## What this repo is best for right now

This repo is best understood as:

- a serious product demo
- a pilot-ready inbox workflow
- a foundation for paid onboarding/pilot projects

It is not yet a fully hardened production platform.

## Links

- Live demo: `https://ai-ops-inbox-one.vercel.app`
- GitHub: `https://github.com/iveteamorim/ai-ops-inbox`

## Notes

If you are evaluating the product, the right question is not:

- “does it have every CRM feature?”

The right question is:

- “does it help a team decide what to answer now, before money is lost?”
