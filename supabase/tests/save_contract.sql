-- Integration checks against the seeded edition. EVERYTHING rolls back, including
-- the temporary test identity, author records, revisions and Storage metadata.
begin;
insert into auth.users (id) values ('00000000-0000-4000-8000-000000000026');
insert into private.tournament_editors (user_id) values ('00000000-0000-4000-8000-000000000026');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000026', true);
set local role authenticated;
do $$
declare
  edition jsonb;
  before_revision bigint;
  after_revision bigint;
begin
  select data, revision into edition, before_revision from public.tournament_editions where edition_year = 2026;
  if edition is null then raise exception 'Missing seeded edition'; end if;
  if not public.is_tournament_editor() then raise exception 'Editor allowlist failed'; end if;
  after_revision := public.save_tournament_edition(2026::smallint, edition, before_revision);
  if after_revision <> before_revision + 1 then raise exception 'Revision increment failed'; end if;
  begin
    perform public.save_tournament_edition(2026::smallint, edition, before_revision);
    raise exception 'Stale save was accepted';
  exception when raise_exception then
    if sqlerrm <> 'TOURNAMENT_REVISION_CONFLICT' then raise; end if;
  end;
  begin
    perform public.save_tournament_edition(2026::smallint, edition, null);
    raise exception 'Duplicate create was accepted';
  exception when raise_exception then
    if sqlerrm <> 'TOURNAMENT_REVISION_CONFLICT' then raise; end if;
  end;
  begin
    update public.tournament_editions set revision = 100 where edition_year = 2026;
    raise exception 'Direct update was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from private.tournament_edition_authors;
    raise exception 'Private author data was exposed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_tournament_edition(2026::smallint, jsonb_set(edition, '{teams}', '"broken"'::jsonb), after_revision);
    raise exception 'Malformed data was accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;
-- A signed-in account outside the allowlist still cannot save.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000027', true);
do $$
begin
  if public.is_tournament_editor() then raise exception 'Non-editor was allowlisted'; end if;
  begin
    perform public.save_tournament_edition(2026::smallint, '{}'::jsonb, 1);
    raise exception 'Non-editor save was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
set local role anon;
do $$
begin
  if not exists (select 1 from public.tournament_editions where edition_year = 2026) then raise exception 'Public read failed'; end if;
  begin
    perform public.save_tournament_edition(2026::smallint, '{}'::jsonb, 1);
    raise exception 'Anonymous save was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: public reads; editor CAS; non-editor/anonymous/direct writes denied; all test changes rolled back' as result;
