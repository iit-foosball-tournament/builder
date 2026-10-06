-- Requires at least one preauthorized address with no Auth account yet.
-- These are transactional fixtures, NOT actual account provisioning: no password,
-- session, identity or email is issued. All data and revisions roll back.
begin;
do $$
declare
  fixture_email text;
  fixture_id uuid := gen_random_uuid();
begin
  select editor.email into fixture_email from private.tournament_editor_emails as editor
    where editor.enabled and not exists (
      select 1 from auth.users as account where lower(account.email) = editor.email
    ) order by editor.email limit 1;
  if fixture_email is null then raise exception 'Test requires a preauthorized address not yet provisioned'; end if;
  insert into auth.users (id, email, email_confirmed_at)
    values (fixture_id, upper(fixture_email), null);
  perform set_config('test.editor_id', fixture_id::text, true);
  perform set_config('test.editor_email', fixture_email, true);
  perform set_config('request.jwt.claim.sub', fixture_id::text, true);
end;
$$;
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'Unverified email was authorized'; end if;
  begin
    perform public.save_tournament_edition(2026::smallint, null, 1);
    raise exception 'Unverified email could save';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from private.tournament_editor_emails;
    raise exception 'Private email allowlist was exposed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
update auth.users set email_confirmed_at = now()
where id = current_setting('test.editor_id')::uuid;
set local role authenticated;
do $$
declare
  edition jsonb;
  before_revision bigint;
  after_revision bigint;
begin
  if not public.is_tournament_editor() then raise exception 'Verified preauthorized email was denied (case normalization)'; end if;
  select data, revision into edition, before_revision from public.tournament_editions where edition_year = 2026;
  after_revision := public.save_tournament_edition(2026::smallint, edition, before_revision);
  if after_revision <> before_revision + 1 then raise exception 'Verified editor save did not advance revision'; end if;
end;
$$;
reset role;
update auth.users set banned_until = now() + interval '1 day'
where id = current_setting('test.editor_id')::uuid;
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'Banned email account was authorized'; end if;
end;
$$;
reset role;
-- A JWT email claim cannot authorize an account with a different server-owned email.
update auth.users set banned_until = null, email = 'not-authorized@example.invalid'
where id = current_setting('test.editor_id')::uuid;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', current_setting('test.editor_id'), 'email', current_setting('test.editor_email')
)::text, true);
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'JWT email overrode the server-owned Auth email'; end if;
end;
$$;
reset role;
update auth.users set email = current_setting('test.editor_email')
where id = current_setting('test.editor_id')::uuid;
update private.tournament_editor_emails set enabled = false
where email = current_setting('test.editor_email');
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'Disabled email authorization was ignored'; end if;
end;
$$;
reset role;
-- Legacy explicit-ID authorization still works, but cannot override Auth bans,
-- deletion or anonymous status.
insert into private.tournament_editors (user_id) values (current_setting('test.editor_id')::uuid);
set local role authenticated;
do $$
begin
  if not public.is_tournament_editor() then raise exception 'Legacy explicit-ID authorization was broken'; end if;
end;
$$;
reset role;
update auth.users set is_anonymous = true where id = current_setting('test.editor_id')::uuid;
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'An explicit-ID grant authorized an anonymous account'; end if;
end;
$$;
reset role;
update auth.users set is_anonymous = false, deleted_at = now() where id = current_setting('test.editor_id')::uuid;
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'An explicit-ID grant authorized a deleted account'; end if;
end;
$$;
reset role;
update auth.users set deleted_at = null, banned_until = now() + interval '1 day' where id = current_setting('test.editor_id')::uuid;
set local role authenticated;
do $$
begin
  if public.is_tournament_editor() then raise exception 'An explicit-ID grant authorized a banned account'; end if;
end;
$$;
reset role;
rollback;
select 'PASS: verified enabled server-owned emails authorize; private list unreadable; legacy grants preserved; spoofed/unverified/disabled emails denied; anonymous/deleted/banned accounts denied across both paths; all test changes rolled back' as result;
