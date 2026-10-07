-- Allow the date-based matchday (roundDates) mapping in the closed edition schema.
-- The builder now organizes matches by date; each giornata maps to a 'YYYY-MM-DD' date
-- stored in edition.roundDates. The server-side validator must accept and validate it.

create or replace function private.validate_tournament_edition(p_data jsonb, p_year smallint)
returns void
language plpgsql
set search_path = ''
as $$
declare
  item jsonb;
  entry jsonb;
  field text;
  rd_row record;
begin
  if p_data is null or pg_catalog.jsonb_typeof(p_data) <> 'object'
    or p_data ?| array['updated_by', 'revision']
    or exists (select 1 from pg_catalog.jsonb_object_keys(p_data) as k
      where k <> all (array['year','name','subtitle','location','accessHours','isFinished',
        'organizers','teams','matches','rounds','knockout','customTrophies','rulesIt','rulesEn','roundDates']))
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

  -- roundDates: giornata (round) -> 'YYYY-MM-DD'. Keys are 1-2 digit round numbers.
  if p_data ? 'roundDates' then
    if pg_catalog.jsonb_typeof(p_data->'roundDates') <> 'object' then
      raise exception 'Invalid roundDates' using errcode = '22023';
    end if;
    for rd_row in select key, value from pg_catalog.jsonb_each(p_data->'roundDates') loop
      if rd_row.key !~ '^[0-9]{1,2}$'
         or pg_catalog.jsonb_typeof(rd_row.value) <> 'string'
         or rd_row.value #>> '{}' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
        raise exception 'Invalid roundDates' using errcode = '22023';
      end if;
    end loop;
  end if;
end;
$$;
revoke all on function private.validate_tournament_edition(jsonb, smallint) from public, anon, authenticated;
