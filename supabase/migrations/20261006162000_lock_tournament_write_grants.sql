-- Supabase default privileges may grant more than the explicit grants in the setup migration.
-- Keep the public role read-only at both the SQL-grant and RLS layers.
revoke all on table public.tournament_editions from public, anon, authenticated;
grant select on table public.tournament_editions to anon, authenticated;
grant insert, update on table public.tournament_editions to authenticated;

drop policy if exists "Approved editors can delete tournament editions"
on public.tournament_editions;
