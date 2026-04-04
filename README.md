# Novua Inbox

**AI decision system for inbound conversations.**

Novua Inbox helps businesses improve response speed, prioritization, and follow-up consistency on inbound conversations.

---

## Live Links

* Live Demo: https://ai-ops-inbox-one.vercel.app
* GitHub: https://github.com/iveteamorim/ai-ops-inbox

---

## Overview

Many businesses don't lose deals due to lack of demand — they lose them due to slow replies, missed follow-ups, and poor lead prioritization.

Novua Inbox introduces an AI-assisted operational layer on top of inbound conversations, helping teams:

* Identify high-value leads
* Prioritize conversations effectively
* Maintain consistent follow-ups
* Surface revenue at risk in real time

---

## Who is this for

Teams handling inbound leads through messaging channels (e.g. WhatsApp) who need to:

* Respond faster without increasing headcount
* Prioritize high-value conversations
* Avoid losing revenue due to delayed replies

---

## How It Works

1. **Message ingestion**  
   Incoming conversations are captured (WhatsApp-first design).

2. **Classification**  
   AI-assisted intent detection categorizes the lead.

3. **Lead scoring**  
   Each conversation is scored based on intent, response delay, and conversation state.

4. **Inbox prioritization**  
   Conversations are ranked to highlight high-value and at-risk leads.

5. **Follow-up system**  
   Unanswered leads trigger follow-up actions.

6. **Revenue visibility**  
   Estimated value is assigned to conversations to highlight potential loss.

---

## Architecture

![Architecture](./docs/architecture.svg)

### Stack

* **Frontend / Backend:** Next.js (App Router + API routes)
* **Database & Auth:** Supabase (PostgreSQL + Row-Level Security)
* **AI Layer:** OpenAI (classification, prioritization signals, suggestions)
* **Deployment:** Vercel

---

## Technical Docs

* [Decisions](./docs/DECISIONS.md)

---

## Technical Decisions

This system is designed as an AI-assisted operational layer, not a full CRM.

* **Next.js App Router**  
  Enables co-located UI and backend logic, allowing fast iteration and simplified API handling for message processing and scoring.

* **Supabase (PostgreSQL + Auth)**  
  Provides multi-tenant support and authentication out of the box, reducing backend complexity in early stages.

* **Deterministic vs AI-assisted logic**  
  Core system behavior (conversation state, follow-ups, revenue tracking) is deterministic.  
  AI is used for classification, prioritization signals, and response suggestions.

* **Lead scoring strategy**  
  Does not rely purely on LLM output.  
  Combines heuristics (intent type, response delay, conversation state) with AI signals to reduce volatility and hallucination risk.

---

## System Boundaries

This system focuses on:

* Inbound conversation handling
* Lead prioritization and follow-up
* Revenue visibility at conversation level

It does not attempt to solve:

* Full customer lifecycle management
* Marketing automation
* Long-term CRM workflows

---

## Trade-offs

* **Demo-first architecture vs production hardening**  
  Prioritized clarity and speed of iteration over full reliability.  
  Some flows (e.g. ingestion, retries) are simplified.

* **Heuristic revenue estimation vs real attribution**  
  Uses predefined lead values instead of measured conversion data.  
  Enables immediate visibility but lacks precision.

* **Inbox-first workflow vs full CRM scope**  
  Focuses on response speed and prioritization rather than full customer lifecycle management.

* **Single-channel (WhatsApp-first) vs multi-channel abstraction**  
  Validates workflow on one channel before expanding.

---

## Expected Impact

This system is designed to:

* Improve response time on inbound leads
* Increase visibility of high-value conversations
* Reduce missed follow-ups
* Surface revenue at risk in real time

> Note: Impact is based on system design and expected behavior, not measured production data.

---

## Production Readiness

This system is currently designed as a functional demo with a clear path to production.

### Current capabilities

* Multi-workspace structure
* Basic role-based access
* WhatsApp webhook scaffolding
* Deterministic conversation state handling
* Demo reseed flow for onboarding and product walkthroughs

### Current limitations

* AI layer not provider-isolated
* No retry logic for webhook failures
* Limited observability and logging
* Revenue estimation not tied to real conversions

### Next steps

* Provider-agnostic AI layer
* Retry + queue system for ingestion
* Audit trail for decisions and actions
* Integration with real conversion data

---

## Failure Modes & Engineering Risks

While the system is designed for clarity and speed of iteration, several failure modes are expected when moving toward production:

* **Duplicate message ingestion**  
  Messaging platforms may retry events, leading to duplicated processing.

* **LLM misclassification**  
  Incorrect intent detection may affect prioritization and lead scoring.

* **Latency in scoring pipeline**  
  AI-assisted classification introduces delays in real-time ranking.

* **Revenue estimation bias**  
  Heuristic value assignment may distort prioritization without real data.

* **Multi-tenant isolation risks**  
  Misconfigured queries or policies may expose cross-tenant data.

---

## Mitigation Strategy (Planned)

* Idempotent message processing
* Confidence thresholds + fallback rules
* Async processing pipeline
* Manual override mechanisms
* Strict tenant isolation (RLS)
* Observability layer (logging + metrics)

---

## Positioning

Novua Inbox is not a CRM.

It is an **AI decision system for inbound conversations**, designed to improve response operations and surface commercial risk in inbound conversations.

The goal is not to manage customers —  
but to ensure no valuable conversation is lost due to slow or inconsistent handling.

---

## Screenshots

![Inbox Demo](https://raw.githubusercontent.com/iveteamorim/ai-ops-inbox/main/public/screenshots/inbox-demo.png)

---

## Project Structure

* `src/app` – pages, routes, API handlers
* `src/components` – UI and flows
* `src/lib` – auth, data, messaging, AI
* `public` – static assets
* `db` – schema
* `docs` – architecture

---

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open: http://localhost:3000

---

## Environment Variables

Required:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

* `SUPABASE_SERVICE_ROLE_KEY`
* `WHATSAPP_VERIFY_TOKEN`
* `WHATSAPP_APP_SECRET`
* `OPENAI_API_KEY`

---

## Scripts

* `npm run dev`
* `npm run build`
* `npm run start`
* `npm run lint`
