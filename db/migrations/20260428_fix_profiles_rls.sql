-- Fix recursive RLS on public.profiles.
-- Apply in Supabase SQL editor or your migration runner before relying on user-scoped RLS again.

begin;

drop policy if exists "profiles_select_own_company" on public.profiles;
drop policy if exists "profiles_select_self" on public.profiles;

create policy "profiles_select_self" on public.profiles
for select
using (id = auth.uid());

commit;
