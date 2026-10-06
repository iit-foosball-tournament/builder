-- Transactional metadata/policy test only. No bytes are uploaded; all test rows,
-- identities, references and revisions are rolled back.
begin;
insert into auth.users (id) values ('00000000-0000-4000-8000-000000000026');
insert into private.tournament_editors (user_id) values ('00000000-0000-4000-8000-000000000026');
insert into storage.objects (bucket_id, name, created_at) values
  ('foosball-team-photos', 'teams/policy-test/00000000-0000-4000-8000-000000000001.jpg', now() - interval '2 days'),
  ('foosball-team-photos', 'teams/policy-test/00000000-0000-4000-8000-000000000002.jpg', now());
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000026', true);
set local role authenticated;
do $$
declare
  edition jsonb;
  rev bigint;
  photo text := 'teams/policy-test/00000000-0000-4000-8000-000000000001.jpg';
  orphan_paths text[];
begin
  select data, revision into edition, rev from public.tournament_editions where edition_year = 2026;
  edition := jsonb_set(edition, '{teams,0,photo}', to_jsonb(photo));
  rev := public.save_tournament_edition(2026::smallint, edition, rev);
  if private.team_photo_unreferenced(photo) then raise exception 'Referenced photo would pass the DELETE policy'; end if;
  orphan_paths := public.list_abandoned_team_photos();
  if photo = any(orphan_paths) or 'teams/policy-test/00000000-0000-4000-8000-000000000002.jpg' = any(orphan_paths) then
    raise exception 'Cleanup includes a referenced or fresh object';
  end if;
  edition := jsonb_set(edition, '{teams,0,photo}', '""'::jsonb);
  rev := public.save_tournament_edition(2026::smallint, edition, rev);
  orphan_paths := public.list_abandoned_team_photos();
  if not photo = any(orphan_paths) then raise exception 'Old abandoned photo was not selected'; end if;
  if not private.team_photo_unreferenced(photo) then raise exception 'Unreferenced photo would fail the DELETE policy'; end if;
  begin
    edition := jsonb_set(edition, '{teams,0,photo}', '"teams/policy-test/00000000-0000-4000-8000-000000000003.jpg"'::jsonb);
    perform public.save_tournament_edition(2026::smallint, edition, rev);
    raise exception 'A missing photo reference was accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: deletion-policy predicate protects references; old orphans selected; fresh files retained; missing references denied; all test data rolled back (Storage API deletion still requires an editor account)' as result;
