-- The `users` RLS policy ("own row" for all) lets a signed-in user update
-- any column on their own row, including is_admin — so it was silently
-- self-grantable via a raw REST PATCH, not just through the app UI. This
-- trigger blocks changes to is_admin when they arrive through PostgREST
-- (auth.role() = 'authenticated'), while still allowing it to be set by a
-- direct CLI/migration run (no JWT context, auth.role() is not
-- 'authenticated') the same way this file itself sets it below.
-- Safe to re-run.

create or replace function prevent_client_admin_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.role() = 'authenticated' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_client_admin_grant on users;
create trigger trg_prevent_client_admin_grant
before update on users
for each row execute function prevent_client_admin_grant();

update users set is_admin = true where email = 'simranbansal1301@gmail.com';
