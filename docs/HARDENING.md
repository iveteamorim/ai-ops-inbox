## Hardening Checklist

This repo already hit three failure classes in production:
- recursive RLS / missing workspace bootstrap
- server pages failing on partially-created workspaces
- client-hook components rendered without `"use client"`

The minimum guardrails are:

1. Run `npm run verify:hardening` before every production deploy.
2. Run `npm run smoke:production` against a real smoke user before high-risk releases.
3. New server routes that depend on a workspace must resolve membership through `src/lib/workspace-access.ts`.
4. New components that use client hooks must pass `scripts/check-client-hooks.mjs`.
5. Production UI experiments must go to preview first, never directly to the live alias.

## Critical Flows

These flows must be rechecked after auth, workspace, inbox, or settings changes:
- signup
- login
- dashboard
- inbox
- open conversation
- settings
- save business setup
- setup request
- invite user
- reset password

## Server Route Rule

For authenticated workspace actions, do not query `profiles` ad hoc from each route.
Use the shared helpers:
- `getWorkspaceMember(user)`
- `canManageWorkspace(role)`

That keeps bootstrap repair and role checks in one place.

## Deployment Rule

If a fix was debug-only:
- deploy it
- collect the real error
- replace it with a durable fix
- remove the debug-only surface afterward
