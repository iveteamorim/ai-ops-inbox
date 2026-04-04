# Decisions

This document captures the main architectural decisions behind Novua Inbox at its current stage.

## 001 - Deterministic conversation state with AI-assisted signals

### Context

The product needs to prioritize inbound conversations, suggest replies, and surface commercial risk without making core operational behavior unpredictable.

### Decision

Conversation state transitions, follow-up status, recovered value, and most inbox behavior remain deterministic.
AI is used for classification, prioritization signals, and response suggestions.

### Why

Pure LLM-driven state handling would make the system volatile in the exact areas where operators need consistency.
The inbox needs stable rules for actions such as reopening lost conversations, marking outcomes, and tracking recoverable value.

### Trade-off

This reduces flexibility compared with a fully agentic flow, but it keeps core operational behavior auditable and easier to reason about.

### What would change in production

AI signals would likely be isolated behind a provider-agnostic interface with confidence thresholds and explicit fallback rules before they influence any user-facing decision path.

## 002 - WhatsApp-first scope before multi-channel abstraction

### Context

The product solves a messaging operations problem, but channel abstraction adds cost early if the main workflow is not yet validated.

### Decision

Novua Inbox validates the workflow on WhatsApp first instead of abstracting multiple channels from day one.

### Why

The operational problem is already visible in one channel, and WhatsApp is a realistic entry point for inbound lead handling.
Starting with a single channel keeps the ingestion path, UI assumptions, and data model simpler while the product logic is still evolving.

### Trade-off

This limits current coverage and means some abstractions will need to be revisited later.

### What would change in production

Additional channels should be added only after the ingestion contract, state model, and prioritization flow are stable enough to generalize.

## 003 - Heuristic revenue estimation in the current product stage

### Context

The system needs to show commercial risk and prioritization value before real attribution and conversion tracking are available.

### Decision

Estimated value is derived from configured lead types and conversation context rather than measured revenue outcomes.

### Why

This makes the product immediately legible in demo and pilot scenarios.
Teams can see potential business impact without waiting for a full analytics or attribution layer.

### Trade-off

Heuristic value is useful for prioritization but not equivalent to real conversion data.
It can bias decisions if presented as exact business truth.

### What would change in production

Estimated value should be complemented or replaced by outcome-linked conversion data, with clearer separation between forecasted value and realized revenue.

## 004 - Next.js App Router plus Supabase for the current stage

### Context

The product needs authenticated multi-workspace flows, a responsive application UI, and backend handlers without introducing too much infrastructure too early.

### Decision

The current implementation uses Next.js App Router for the application surface and route handlers, with Supabase for PostgreSQL, auth, and row-level security.

### Why

This keeps UI, backend logic, and deployment close together and makes iteration faster.
Supabase provides a practical way to enforce tenant boundaries early without building a separate backend service first.

### Trade-off

This approach favors speed and cohesion over stronger service separation.
As the system grows, tighter boundaries between ingestion, scoring, and application concerns may become necessary.

### What would change in production

High-throughput ingestion, retries, and background scoring would likely move toward queue-backed or service-separated execution paths while preserving the current application model for operator-facing workflows.
