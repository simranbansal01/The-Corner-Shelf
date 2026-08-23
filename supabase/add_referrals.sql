-- Tracked referrals for the Dashboard book's "Invite a Friend" page: every
-- user gets a short unique code, new signups arriving via ?ref=<code> get
-- attributed back to the inviter (see App.jsx's RootGate.ensureProfile()).
-- Safe to re-run.

alter table users add column if not exists referral_code text unique
  default substr(md5(random()::text), 1, 8);
alter table users add column if not exists referred_by uuid references users(id);

update users set referral_code = substr(md5(random()::text || id::text), 1, 8)
  where referral_code is null;

-- Cross-user lookups are deliberately NOT a broad SELECT policy on `users`
-- (that would let any signed-in caller read every row via the REST API:
-- email, tier, onboarding answers, everything). These two security-definer
-- RPCs expose only what's needed, nothing else.

create or replace function resolve_referral_code(code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from users where referral_code = code limit 1;
$$;
grant execute on function resolve_referral_code(text) to authenticated, anon;

create or replace function get_my_referrals()
returns table(display_name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select display_name, created_at from users where referred_by = auth.uid();
$$;
grant execute on function get_my_referrals() to authenticated;
