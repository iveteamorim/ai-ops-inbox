# Novua Inbox

Operational inbox for teams that lose revenue when high-intent conversations wait too long.

**Live demo:** https://app.novua.digital

Novua is not a CRM. It is a decision layer that answers one question:

**Which conversation needs attention now, who owns it, and what is at risk if nobody acts?**

---

## Problem

Most inbound revenue is not lost because leads disappear. It is lost because:

- replies arrive too late
- high-value conversations hide in the noise
- ownership is unclear
- follow-ups never happen

---

## Product

| Surface | Purpose |
|--------|---------|
| **Inbox** | Prioritized conversation cards with state, delay, value, and next action |
| **Dashboard** | Snapshot of revenue at risk and what to handle first |
| **Conversation workspace** | Agent-controlled replies with quick replies and AI suggestions |
| **Settings** | Channels, lead values, team, and business setup |

### Channels

- Web form (live)
- Email (live)
- WhatsApp / Instagram (Meta verification dependent)

### AI model

AI supports classification and reply suggestions. Critical behavior stays deterministic:

- conversation ownership on first reply
- duplicate-reply protection
- state transitions and assignment rules

---

## Example flow

A clinic receives WhatsApp and form inquiries daily.

**Before:** every thread looks the same; high-value pricing questions wait behind generic greetings.

**With Novua:** pricing intent is surfaced, the agent gets a Spanish suggestion for “bono sesiones”, and the team responds from one workspace.

---

## Tech stack

- **Next.js 15** (App Router) · **React 19**
- **Supabase** (auth, Postgres, RLS)
- **Vercel** (deployment)
- **OpenAI** (optional reply suggestions)

---

## Local development

**Requirements:** Node.js 20+, Supabase project

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Required environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

See `.env.example` for optional integrations (WhatsApp, Instagram, Stripe, email).

### Quality checks

```bash
npm run verify:hardening
```

---

## Architecture notes

- Multi-tenant workspace model with role-based access (owner, admin, agent)
- Inbox prioritization from lead type, status, delay, and estimated value
- Quick replies with multilingual keyword matching (PT / ES / EN)
- Reply suggestions detect customer language and pricing intent before falling back to generic copy

---

## Repository status

This is a pilot-ready product codebase: real auth, inbox operations, channel setup, and deployment — not a tutorial app.

It is **not** a full CRM or a fully hardened production platform.

---

## License

Source-available and proprietary.

Copyright (c) 2026 Ivete de Amorim. All rights reserved.

Commercial licensing: iveteamorin@gmail.com
