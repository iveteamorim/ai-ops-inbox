## Release Process

This is the minimum release process to avoid shipping broken auth, workspace, inbox, or settings flows.

### Before Every Production Deploy

### 1-Minute Checklist

1. `npm run verify:hardening`
2. `npm run smoke:user:create`
3. `npm run smoke:production`
4. If auth or workspace changed, manually check:
   `signup`, `login`, `settings`, `invite`, `accept invite`
5. Only then deploy or alias to production

0. Ensure the smoke user exists and is repaired:

```bash
. ./.env.smoke.example # copy values into your real env first

NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
SMOKE_USER_EMAIL=... \
SMOKE_USER_PASSWORD=... \
npm run smoke:user:create
```

1. Run:

```bash
npm run verify:hardening
```

This verifies:
- lint
- client-hook components correctly marked with `"use client"`

2. Run production smoke against a real smoke user:

```bash
SMOKE_APP_URL=https://app.novua.digital \
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
SMOKE_USER_EMAIL=... \
SMOKE_USER_PASSWORD=... \
npm run smoke:production
```

Recommended fixed values:
- `SMOKE_USER_EMAIL=smoke@novua.digital`
- `SMOKE_COMPANY_NAME=Smoke Test Workspace`
- `SMOKE_USER_FULL_NAME=Smoke Test Owner`

3. Manually verify high-risk product flows when auth, RLS, workspace bootstrap, or settings changed:
- signup
- login
- dashboard
- inbox
- open conversation
- settings
- save business setup
- setup request
- invite user
- accept invite
- create password
- reset password

### Rules

- No visual experiments directly in production.
- Preview first, approval second, production last.
- If a debug message was added to user-facing UI, it must be removed after the root cause is fixed.
- Any new authenticated route must use shared workspace access helpers instead of raw per-route `profiles` lookups.

### Incident Trigger

If any of these break:
- settings
- inbox
- dashboard
- auth / invitation

then stop release work and do:

1. `vercel logs <deployment>`
2. `npm run smoke:production`
3. check recent workspace/auth changes
4. check `profiles`/`companies` access path
