# Failure Modes

This document captures the main operational risks expected in Novua Inbox as the system moves from demo-grade behavior toward production-grade reliability.

## 001 - Duplicate webhook delivery

### Risk

Messaging providers may retry delivery of the same event.
Without idempotent ingestion, the system can persist duplicate messages, trigger duplicate follow-up logic, or distort conversation timelines.

### Current handling

The current implementation is structured around stable conversation and message persistence rules, but it does not yet expose a full retry-safe ingestion layer as a formal subsystem.

### Missing

- Explicit idempotency guarantees across all ingestion paths
- Retry-aware logging and diagnostics
- Clear replay-safe processing contract

### Production mitigation

- Deduplicate on provider event IDs or external message IDs
- Make message persistence idempotent by design
- Separate raw event capture from downstream processing

## 002 - LLM misclassification

### Risk

AI output may incorrectly classify intent, urgency, or suggested next action.
If these signals become too influential, the inbox can prioritize the wrong conversations.

### Current handling

Core operational behavior remains deterministic.
State transitions, recovered value, and most status handling are not delegated to the model.

### Missing

- Confidence-aware decision thresholds
- Explicit low-confidence fallback behavior
- Review tooling for model-driven classification drift

### Production mitigation

- Add confidence thresholds before AI signals affect prioritization
- Fall back to heuristic scoring when confidence is low
- Track false positives and false negatives in real usage

## 003 - Synchronous scoring latency

### Risk

If classification and scoring happen inline with request-time flows, latency spikes can slow down inbox updates and degrade operator experience.

### Current handling

The current product favors simplicity and fast iteration over queue-backed asynchronous orchestration.

### Missing

- Async scoring pipeline
- Queue-backed retries for delayed or failed jobs
- Timeout-aware degradation path

### Production mitigation

- Move non-critical scoring work to async processing
- Cache or stage intermediate signals where useful
- Degrade gracefully when AI latency exceeds operational thresholds

## 004 - Revenue estimation bias

### Risk

Configured lead values make the system legible, but they can overstate or understate actual business impact.
That can bias prioritization if estimation is treated like real revenue.

### Current handling

Estimated value is treated as a heuristic signal for prioritization rather than as verified commercial outcome.

### Missing

- Clearer attribution model between estimated and realized value
- Outcome-linked revenue feedback loop
- Historical calibration against real conversions

### Production mitigation

- Separate forecasted value from recovered or realized value more explicitly
- Integrate conversion outcomes into the scoring model
- Recalibrate lead values from real business data

## 005 - Multi-tenant isolation failure

### Risk

A mistake in workspace scoping, query filters, or row-level security can expose data across tenants.
This is a product-critical failure mode.

### Current handling

The system uses workspace-aware data patterns and Supabase row-level security as the primary tenant boundary.

### Missing

- More explicit tenant-boundary testing
- Stronger audit visibility for cross-tenant access attempts
- Deeper validation of every operator-facing data path

### Production mitigation

- Add tenant isolation tests for every high-risk query path
- Review and harden RLS policies continuously
- Add audit logging for sensitive access and mutation paths

## 006 - Manual state misuse

### Risk

Operators can mark conversations as won, lost, or reopened incorrectly.
That can distort revenue visibility and pipeline understanding.

### Current handling

The product keeps state transitions explicit in the UI and preserves deterministic handling around state effects.

### Missing

- Audit trail for status changes
- Reason capture for critical manual overrides
- Visibility into who changed what and when

### Production mitigation

- Add state change audit logs
- Require structured reason capture for critical outcome changes
- Provide reversible actions with clear change history
