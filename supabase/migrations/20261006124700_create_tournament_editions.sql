create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.tournament_editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.tournament_editors enable row level security;
revoke all on private.tournament_editors from public, anon, authenticated;

create or replace function public.is_tournament_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from private.tournament_editors as editor
      where editor.user_id = (select auth.uid())
    );
$$;
revoke all on function public.is_tournament_editor() from public, anon, authenticated;
grant execute on function public.is_tournament_editor() to authenticated;

create table public.tournament_editions (
  edition_year smallint primary key check (edition_year between 2000 and 2100),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.tournament_editions enable row level security;
grant select on public.tournament_editions to anon, authenticated;
grant insert, update, delete on public.tournament_editions to authenticated;

create policy "Tournament editions are publicly readable"
on public.tournament_editions
for select
to anon, authenticated
using (true);

create policy "Approved editors can create tournament editions"
on public.tournament_editions
for insert
to authenticated
with check (public.is_tournament_editor());

create policy "Approved editors can update tournament editions"
on public.tournament_editions
for update
to authenticated
using (public.is_tournament_editor())
with check (public.is_tournament_editor());

create policy "Approved editors can delete tournament editions"
on public.tournament_editions
for delete
to authenticated
using (public.is_tournament_editor());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'foosball-team-photos',
  'foosball-team-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
);

create policy "Approved editors can list team photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'foosball-team-photos' and public.is_tournament_editor());

create policy "Approved editors can upload team photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'foosball-team-photos' and public.is_tournament_editor());

create policy "Approved editors can replace team photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'foosball-team-photos' and public.is_tournament_editor())
with check (bucket_id = 'foosball-team-photos' and public.is_tournament_editor());

create policy "Approved editors can remove team photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'foosball-team-photos' and public.is_tournament_editor());

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'tournament_editions'
    ) then
    alter publication supabase_realtime add table public.tournament_editions;
  end if;
end;
$$;
