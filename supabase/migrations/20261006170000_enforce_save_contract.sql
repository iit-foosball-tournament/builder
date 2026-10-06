-- Keep author identities outside public rows, including Realtime change payloads.
create table private.tournament_edition_authors (
  edition_year smallint primary key references public.tournament_editions(edition_year) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null
);
alter table private.tournament_edition_authors enable row level security;
revoke all on private.tournament_edition_authors from public, anon, authenticated;
insert into private.tournament_edition_authors (edition_year, updated_by)
select edition_year, updated_by from public.tournament_editions;
alter table public.tournament_editions drop column updated_by;

revoke all on table public.tournament_editions from public, anon, authenticated;
grant select on table public.tournament_editions to anon, authenticated;
drop policy if exists "Approved editors can create tournament editions" on public.tournament_editions;
drop policy if exists "Approved editors can update tournament editions" on public.tournament_editions;
drop policy if exists "Approved editors can delete tournament editions" on public.tournament_editions;

-- This validator is private; the RPC is the sole publicly callable write entry point.
create or replace function private.validate_tournament_edition(p_data jsonb, p_year smallint)
returns void
language plpgsql
set search_path = ''
as $$
declare
  item jsonb;
  entry jsonb;
  field text;
begin
  if p_data is null or pg_catalog.jsonb_typeof(p_data) <> 'object'
    or p_data ?| array['updated_by', 'revision']
    or exists (select 1 from pg_catalog.jsonb_object_keys(p_data) as k
      where k <> all (array['year','name','subtitle','location','accessHours','isFinished',
        'organizers','teams','matches','rounds','knockout','customTrophies','rulesIt','rulesEn']))
    or pg_catalog.jsonb_typeof(p_data->'name') is distinct from 'string'
    or pg_catalog.jsonb_typeof(p_data->'teams') is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_data->'matches') is distinct from 'array'
    or (p_data ? 'year' and (pg_catalog.jsonb_typeof(p_data->'year') <> 'number'
      or p_data->>'year' <> p_year::text))
    or (p_data ? 'isFinished' and pg_catalog.jsonb_typeof(p_data->'isFinished') <> 'boolean')
    or pg_catalog.pg_column_size(p_data) > 2097152 then
    raise exception 'Invalid tournament edition' using errcode = '22023';
  end if;

  foreach field in array array['subtitle','location','accessHours','rulesIt','rulesEn'] loop
    if p_data ? field and pg_catalog.jsonb_typeof(p_data->field) <> 'string' then
      raise exception 'Invalid edition field %', field using errcode = '22023';
    end if;
  end loop;

  for item in select value from pg_catalog.jsonb_array_elements(p_data->'teams') loop
    if pg_catalog.jsonb_typeof(item) <> 'object'
      or exists (select 1 from pg_catalog.jsonb_object_keys(item) as k
        where k <> all (array['id','num','name','logoColor','player1','player2','photo']))
      or pg_catalog.jsonb_typeof(item->'name') is distinct from 'string'
      or (item ? 'num' and pg_catalog.jsonb_typeof(item->'num') <> 'number') then
      raise exception 'Invalid team' using errcode = '22023';
    end if;
    foreach field in array array['id','logoColor','player1','player2','photo'] loop
      if item ? field and pg_catalog.jsonb_typeof(item->field) <> 'string' then
        raise exception 'Invalid team field %', field using errcode = '22023';
      end if;
    end loop;
    if item ? 'photo' and item->>'photo' <> '' and
      (item->>'photo' !~* '^teams/[a-zA-Z0-9_-]{1,80}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$') then
      raise exception 'Invalid team photo path' using errcode = '22023';
    end if;
  end loop;

  -- Knockout is a keyed map of matches; match fields are deliberately closed.
  if p_data ? 'knockout' then
    if pg_catalog.jsonb_typeof(p_data->'knockout') <> 'object' then
      raise exception 'Invalid knockout' using errcode = '22023';
    end if;
  end if;
  for item in
    select value from pg_catalog.jsonb_array_elements(p_data->'matches')
    union all
    select value from pg_catalog.jsonb_each(case when pg_catalog.jsonb_typeof(p_data->'knockout') = 'object'
      then p_data->'knockout' else '{}'::jsonb end)
  loop
    if pg_catalog.jsonb_typeof(item) <> 'object'
      or exists (select 1 from pg_catalog.jsonb_object_keys(item) as k
        where k <> all (array['id','name','round','roundNum','matchNum','team1','team2',
          'score1','score2','status','date','time','pitch']))
      or pg_catalog.jsonb_typeof(item->'team1') is distinct from 'string'
      or pg_catalog.jsonb_typeof(item->'team2') is distinct from 'string' then
      raise exception 'Invalid match' using errcode = '22023';
    end if;
    foreach field in array array['id','name','round','status','date','time','pitch'] loop
      if item ? field and pg_catalog.jsonb_typeof(item->field) <> 'string' then
        raise exception 'Invalid match field %', field using errcode = '22023';
      end if;
    end loop;
    foreach field in array array['score1','score2','roundNum','matchNum'] loop
      if item ? field and pg_catalog.jsonb_typeof(item->field) <> 'number'
        and not (field in ('score1','score2') and item->field = 'null'::jsonb) then
        raise exception 'Invalid match number %', field using errcode = '22023';
      end if;
    end loop;
  end loop;

  foreach field in array array['rounds','organizers','customTrophies'] loop
    if p_data ? field and pg_catalog.jsonb_typeof(p_data->field) <> 'array' then
      raise exception 'Invalid edition array %', field using errcode = '22023';
    end if;
  end loop;
  for item in select value from pg_catalog.jsonb_array_elements(coalesce(p_data->'rounds', '[]'::jsonb)) loop
    if pg_catalog.jsonb_typeof(item) <> 'object'
      or exists (select 1 from pg_catalog.jsonb_object_keys(item) as k
        where k <> all (array['name','type','roundNum','knockoutType'])) then
      raise exception 'Invalid round' using errcode = '22023';
    end if;
    foreach field in array array['name','type','knockoutType'] loop
      if item ? field and pg_catalog.jsonb_typeof(item->field) <> 'string' then
        raise exception 'Invalid round field' using errcode = '22023';
      end if;
    end loop;
    if item ? 'roundNum' and pg_catalog.jsonb_typeof(item->'roundNum') <> 'number' then
      raise exception 'Invalid round number' using errcode = '22023';
    end if;
  end loop;
  for item in select value from pg_catalog.jsonb_array_elements(coalesce(p_data->'organizers', '[]'::jsonb)) loop
    -- Organizers' email addresses are already in the bundled public edition.
    if pg_catalog.jsonb_typeof(item) <> 'object'
      or exists (select 1 from pg_catalog.jsonb_object_keys(item) as k
        where k <> all (array['name','email']))
      or pg_catalog.jsonb_typeof(item->'name') is distinct from 'string'
      or (item ? 'email' and pg_catalog.jsonb_typeof(item->'email') <> 'string') then
      raise exception 'Invalid organizer' using errcode = '22023';
    end if;
  end loop;
  for item in select value from pg_catalog.jsonb_array_elements(coalesce(p_data->'customTrophies', '[]'::jsonb)) loop
    if pg_catalog.jsonb_typeof(item) <> 'object'
      or exists (select 1 from pg_catalog.jsonb_object_keys(item) as k
        where k <> all (array['name','team','description'])) then
      raise exception 'Invalid trophy' using errcode = '22023';
    end if;
    foreach field in array array['name','team','description'] loop
      if item ? field and pg_catalog.jsonb_typeof(item->field) <> 'string' then
        raise exception 'Invalid trophy field' using errcode = '22023';
      end if;
    end loop;
  end loop;
end;
$$;
revoke all on function private.validate_tournament_edition(jsonb, smallint) from public, anon, authenticated;

create or replace function public.save_tournament_edition(
  p_year smallint, p_data jsonb, p_expected_revision bigint default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_revision bigint;
  next_revision bigint;
begin
  if (select auth.uid()) is null or not public.is_tournament_editor() then
    raise exception 'Not an approved tournament editor' using errcode = '42501';
  end if;
  if p_year is null or p_year not between 2000 and 2100 then
    raise exception 'Invalid edition year' using errcode = '22023';
  end if;
  perform private.validate_tournament_edition(p_data, p_year);
  -- A draft may reference only existing objects; lock them against concurrent deletion.
  perform object.id from storage.objects as object
    where object.bucket_id = 'foosball-team-photos'
      and object.name in (select team->>'photo' from pg_catalog.jsonb_array_elements(p_data->'teams') as team)
    for key share;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_data->'teams') as team
    where coalesce(team->>'photo', '') <> '' and not exists (
      select 1 from storage.objects as object
      where object.bucket_id = 'foosball-team-photos' and object.name = team->>'photo'
    )
  ) then
    raise exception 'Team photo is no longer available' using errcode = '22023';
  end if;

  if p_expected_revision is null then
    insert into public.tournament_editions (edition_year, data, revision, updated_at)
    values (p_year, p_data, 1, pg_catalog.now())
    on conflict (edition_year) do nothing
    returning revision into next_revision;
    if next_revision is null then
      raise exception 'TOURNAMENT_REVISION_CONFLICT' using errcode = 'P0001';
    end if;
  else
    if p_expected_revision < 1 then
      raise exception 'Invalid expected revision' using errcode = '22023';
    end if;
    select revision into current_revision from public.tournament_editions
      where edition_year = p_year for update;
    if current_revision is null or current_revision <> p_expected_revision then
      raise exception 'TOURNAMENT_REVISION_CONFLICT' using errcode = 'P0001';
    end if;
    update public.tournament_editions
      set data = p_data, revision = revision + 1,
          updated_at = pg_catalog.now()
      where edition_year = p_year returning revision into next_revision;
  end if;
  insert into private.tournament_edition_authors (edition_year, updated_by)
  values (p_year, (select auth.uid()))
  on conflict (edition_year) do update set updated_by = (select auth.uid());
  return next_revision;
end;
$$;
revoke all on function public.save_tournament_edition(smallint, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.save_tournament_edition(smallint, jsonb, bigint) to authenticated;

-- Storage's API executes deletes as the editor. Serialize with edition writes so a
-- concurrently saved reference cannot be deleted after a stale existence check.
create or replace function private.team_photo_unreferenced(p_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_name is null or p_name !~* '^teams/[a-zA-Z0-9_-]{1,80}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    return false;
  end if;
  lock table public.tournament_editions in share mode;
  return not exists (
    select 1 from public.tournament_editions as edition,
      pg_catalog.jsonb_array_elements(edition.data->'teams') as team
    where team->>'photo' = p_name
  );
end;
$$;
revoke all on function private.team_photo_unreferenced(text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.team_photo_unreferenced(text) to authenticated;
-- Uploads never upsert: prevent rename/update of a referenced object.
drop policy if exists "Approved editors can replace team photos" on storage.objects;
drop policy if exists "Approved editors can remove team photos" on storage.objects;
create policy "Approved editors can remove unreferenced team photos"
on storage.objects for delete to authenticated
using (bucket_id = 'foosball-team-photos' and public.is_tournament_editor()
  and private.team_photo_unreferenced(name));
