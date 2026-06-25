# Operations

## Critical rule

Do not rely on recursive RLS policies for `public.profiles`.

The broken pattern was:

```sql
using (company_id = (select p.company_id from public.profiles p where p.id = auth.uid()))
```

That causes:

- `infinite recursion detected in policy for relation "profiles"`
- cascading failures in pages that read `profiles`
- secondary failures in tables whose RLS depends on `profiles`

## Required SQL fix

Apply:

```sql
drop policy if exists "profiles_select_own_company" on public.profiles;
drop policy if exists "profiles_select_self" on public.profiles;

create policy "profiles_select_self" on public.profiles
for select
using (id = auth.uid());
```

Versioned migration:

- [db/migrations/20260428_fix_profiles_rls.sql](/Users/albertcalvet/Downloads/novua-inbox/db/migrations/20260428_fix_profiles_rls.sql)

## Production smoke

Create or repair the smoke user first:

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
SMOKE_USER_EMAIL=... \
SMOKE_USER_PASSWORD=... \
npm run smoke:user:create
```

Run before and after production changes:

```bash
SMOKE_APP_URL=https://app.novua.digital \
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
SMOKE_USER_EMAIL=... \
SMOKE_USER_PASSWORD=... \
npm run smoke:production
```

What it verifies:

- public app routes respond
- Supabase password login works
- the smoke user has `profile` and `company`
- the workspace can read conversation count

## Manual high-risk checks

After auth or RLS changes, verify:

1. Login
2. Signup
3. Dashboard
4. Inbox
5. Invite user
6. Reset password
7. Demo workspace reseed

## Incident rule

If `dashboard` or `inbox` break again with auth working:

1. Check RLS on `profiles`
2. Check server-side code paths that still use the authenticated client against protected tables
3. Run `npm run smoke:production`
