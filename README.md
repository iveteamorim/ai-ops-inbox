# Novua Inbox — AI operations decision system

Conversation operations workspace for teams that lose money when replies arrive too late.

Most teams don't know they are losing money in their inbox.

Novua makes that visible — and actionable.

---

## 💰 What is at risk right now?

Most teams don't lose inbound revenue because leads disappear.

They lose it because nobody acts in time.

- replies arrive too late  
- high-value conversations are hidden in the noise  
- ownership is unclear  
- follow-ups never happen  

The result is simple:

→ money is lost silently inside the inbox

---

## 🧠 What Novua does differently

Novua Inbox is not a CRM.

It is an operating layer that answers one question:

**What conversation needs attention now, who owns it, and what is at risk if nobody acts?**

---

## ⚡ What you see immediately

- 💰 what is at risk right now  
- 🔴 which conversations are critical  
- 👤 who is responsible for each one  
- 👉 what action should happen next  

---

## 🚀 Live

One-click demo: https://ai-ops-inbox-one.vercel.app/demo  
Manual demo login: demo@novua.digital / NovuaDemo2026!  
Landing: https://ai-ops-inbox-one.vercel.app  
Repo: https://github.com/iveteamorim/ai-ops-inbox

---
## 📸 Screenshot

## 📸 Product preview

<img src="https://raw.githubusercontent.com/iveteamorim/ai-ops-inbox/main/public/screenshots/inbox-demo-current.png" width="100%" />

---
## 🧩 Example

A clinic receives multiple WhatsApp inquiries per day.

Before:

- all conversations look the same  
- replies depend on whoever is available  
- valuable leads are missed  

With Novua:

- high-value conversations are surfaced as *En riesgo*  
- ownership is assigned automatically on first reply  
- the team sees exactly what to answer next  

→ response improves before revenue is lost

---

## 🧠 AI usage & decision model

Novua does not rely purely on AI to make decisions.

The system combines:

- deterministic logic (state, ownership, timing)  
- estimated value signals defined in the workspace  
- optional AI assistance (classification, structured outputs, reply suggestions)  

AI is used as a support layer, not as the source of truth.

Critical decisions such as assignment, state transitions, and blocking duplicate replies are handled deterministically.

This ensures reliability in multi-agent environments where incorrect AI outputs could create operational conflicts.

---

## ⚖️ Key decisions & trade-offs

**Not a CRM**  
The system intentionally avoids becoming a full CRM.  
It focuses on prioritization and decision-making at the moment of action.

**AI is not required**  
The product works without AI.  
AI improves suggestions, but the core system remains functional and predictable without it.

**Inbox-first model**  
Instead of managing contacts or pipelines, the system centers the inbox as the operational surface.

**Ownership via action**  
Ownership is not assigned upfront.  
It is claimed through the first real reply to reflect actual responsibility.

**Trade-off: not real-time websockets**  
The UI uses periodic refresh instead of full real-time synchronization.  
Protection against conflicts is enforced server-side.

---

## ⚠️ Failure modes

**AI suggestion errors**  
AI-generated replies may be incorrect or irrelevant.  
The system treats them as suggestions, never as automatic actions.

**Race conditions**  
Two agents may attempt to reply simultaneously.  
The backend enforces a claim check to prevent double responses.

**Incorrect value estimation**  
Lead value is estimated based on predefined types.  
If misconfigured, prioritization may be skewed.

**Delayed updates**  
Due to periodic refresh, UI may not reflect changes instantly.  
The system prioritizes consistency over instant visual updates.

---

## 🧩 Product model

### Inbox

The inbox is the main operating surface.

It renders conversations as decision cards instead of administrative rows, with emphasis on:

- En riesgo  
- Nuevo  
- En conversación  
- Ganado  
- Perdido  

Each card highlights:

- current state  
- response delay  
- estimated value  
- assignment  
- next action  

---

### Conversation ownership

The first agent who sends a real reply claims the conversation.

- ownership remains after claim  
- owner/admin can bulk reassign conversations  
- backend blocks duplicate replies  

---

### Dashboard

The dashboard answers:

- what is at risk now  
- what is active now  
- what should be handled next  

---

### Revenue

The revenue view is built around:

- money at risk now  
- open pipeline value  
- recently recovered value  
- immediate actions required  

---

### Settings

Defines:

- channel status  
- prioritization logic  
- team structure  
- business setup and lead values  

---

## 👥 Roles

**Owner**  
- manages workspace  
- invites/removes users  
- reassigns conversations  
- edits business setup  

**Admin**  
- manages team  
- operates conversations  

**Agent**  
- works inbox  
- replies  
- sees system state  

---

## 🚧 What is still early

- full production hardening  
- webhook retry and idempotency maturity  
- deeper observability  
- business setup UX  
- edge-case handling  

---

## 🧱 Tech stack

- Next.js (App Router)  
- React 19  
- Supabase (auth + database)  
- Vercel (deployment)  
- LLM-based assistance (classification, structured outputs, reply suggestions)  

---

## ⚙️ Local setup

### Requirements

- Node.js >= 20  
- Supabase project  

### Install

npm install

### Run

npm run dev

http://localhost:3000

---

## 🔐 Environment variables

Required:

- NEXT_PUBLIC_SUPABASE_URL  
- NEXT_PUBLIC_SUPABASE_ANON_KEY  

Server:

- SUPABASE_SERVICE_ROLE_KEY  

Optional:

- OPENAI_API_KEY  
- WHATSAPP_VERIFY_TOKEN  
- INSTAGRAM_VERIFY_TOKEN  

---

## 📁 Project structure

- src/app → routes & API  
- src/components → UI  
- src/lib → logic, auth, scoring  
- public → assets  
- docs → documentation  

---

## 🧠 Operational behavior worth knowing

**Assignment visibility**  
A conversation is only considered assigned after a real reply.

**Multi-agent safety**  
- periodic refresh (UI)  
- backend claim enforcement  

---

## 🎯 What this repo is

- a serious product demo  
- a pilot-ready system  
- a foundation for real deployments  

---

## ❌ What this repo is not

- a full CRM  
- a fully hardened production system  

---

## 🧨 Bottom line

The key question is not:

"does it have every CRM feature?"

The key question is:

**"does it help a team decide what to answer now, before value is lost?"**
