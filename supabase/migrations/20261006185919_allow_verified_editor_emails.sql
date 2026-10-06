-- Pre-authorize editor addresses without creating Auth users, passwords or emails.
-- The actual addresses are configured privately via administrative SQL, never in
-- this public repository or a browser bundle.
create table private.tournament_editor_emails (
  email text primary key
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table private.tournament_editor_emails enable row level security;
revoke all on table private.tournament_editor_emails from public, anon, authenticated;

create or replace function public.is_tournament_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Check server-owned Auth data, NOT JWT email or editable user metadata.
  select exists (
    select 1 from auth.users as account
    where account.id = (select auth.uid())
      and account.is_anonymous is not true
      and account.deleted_at is null
      and (account.banned_until is null or account.banned_until <= pg_catalog.now())
      and (
        exists (
          select 1 from private.tournament_editors as editor
          where editor.user_id = account.id
        ) or (
          account.email_confirmed_at is not null and exists (
            select 1 from private.tournament_editor_emails as editor
            where editor.enabled and editor.email = pg_catalog.lower(account.email)
          )
        )
      )
  );
$$;
revoke all on function public.is_tournament_editor() from public, anon, authenticated;
grant execute on function public.is_tournament_editor() to authenticated;
