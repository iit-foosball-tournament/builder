-- Interrupted uploads can succeed after an editor's session expires. On a later
-- editor login, sweep a bounded batch of old, unreferenced objects via Storage's
-- API (never delete Storage metadata directly; that would leave underlying files).
create or replace function public.list_abandoned_team_photos()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  paths text[];
begin
  if (select auth.uid()) is null or not public.is_tournament_editor() then
    raise exception 'Not an approved tournament editor' using errcode = '42501';
  end if;
  select coalesce(array_agg(name), array[]::text[]) into paths from (
    select object.name from storage.objects as object
    where object.bucket_id = 'foosball-team-photos'
      and object.created_at < pg_catalog.now() - interval '1 day'
      and object.name ~* '^teams/[a-zA-Z0-9_-]{1,80}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
      and not exists (
        select 1 from public.tournament_editions as edition,
          pg_catalog.jsonb_array_elements(edition.data->'teams') as team
        where team->>'photo' = object.name
      )
    order by object.created_at
    limit 100
  ) as abandoned;
  return paths;
end;
$$;
revoke all on function public.list_abandoned_team_photos() from public, anon, authenticated;
grant execute on function public.list_abandoned_team_photos() to authenticated;
