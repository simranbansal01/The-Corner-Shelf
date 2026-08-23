-- Admin-only platform analytics dashboard. Single-admin app: is_admin is a
-- plain boolean flag checked inside every admin_* RPC below via
-- assert_admin(), NOT a broad table policy — a policy would let any
-- signed-in caller read every row of every table via the REST API, same
-- reasoning add_referrals.sql already documents for the same problem.
-- Safe to re-run.

alter table users add column if not exists is_admin boolean not null default false;
update users set is_admin = true where email = 'simranbansal1301@gmail.com';

create or replace function assert_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from users where id = auth.uid() and is_admin) then
    raise exception 'not authorized';
  end if;
end;
$$;

create or replace function admin_overview()
returns table(
  total_users bigint,
  users_with_tier bigint,
  total_task_attempts bigint,
  overall_accuracy_pct numeric,
  total_referrals bigint,
  active_users_7d bigint,
  total_buddy_opens bigint,
  total_chapters_completed bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query select
    (select count(*) from users),
    (select count(*) from users where tier is not null),
    (select count(*) from task_attempts),
    (select coalesce(round(100.0 * sum(case when is_correct then 1 else 0 end) / nullif(count(*), 0), 1), 0) from task_attempts),
    (select count(*) from users where referred_by is not null),
    (select count(distinct user_id) from events where occurred_at > now() - interval '7 days'),
    (select count(*) from events where event_name in ('buddy_icon_clicked', 'buddy_auto_reacted')),
    (select count(*) from learn_progress);
end;
$$;

create or replace function admin_signups_by_day(days_back int default 30)
returns table(day date, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select created_at::date as day, count(*)
    from users
    where created_at > now() - (days_back || ' days')::interval
    group by day
    order by day;
end;
$$;

create or replace function admin_tier_distribution()
returns table(tier text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select coalesce(u.tier, 'none'), count(*)
    from users u
    group by u.tier;
end;
$$;

create or replace function admin_task_accuracy_by_confidence()
returns table(confidence text, accuracy_pct numeric, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select ta.confidence,
      round(100.0 * sum(case when ta.is_correct then 1 else 0 end) / nullif(count(*), 0), 1),
      count(*)
    from task_attempts ta
    group by ta.confidence;
end;
$$;

create or replace function admin_task_activity_by_day(days_back int default 30)
returns table(day date, attempts bigint, accuracy_pct numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select submitted_at::date, count(*),
      round(100.0 * sum(case when is_correct then 1 else 0 end) / nullif(count(*), 0), 1)
    from task_attempts
    where submitted_at > now() - (days_back || ' days')::interval
    group by 1
    order by 1;
end;
$$;

create or replace function admin_buddy_usage_by_day(days_back int default 30)
returns table(day date, opens bigint, questions bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select occurred_at::date,
      count(*) filter (where event_name in ('buddy_icon_clicked', 'buddy_auto_reacted')),
      count(*) filter (where event_name = 'buddy_question_asked')
    from events
    where occurred_at > now() - (days_back || ' days')::interval
    group by 1
    order by 1;
end;
$$;

create or replace function admin_buddy_source_split()
returns table(source text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select coalesce(payload ->> 'source', 'unknown'), count(*)
    from events
    where event_name = 'llm_call_succeeded'
    group by 1;
end;
$$;

create or replace function admin_hardest_tasks(min_attempts int default 3, limit_count int default 10)
returns table(task_id text, category text, difficulty text, attempts bigint, accuracy_pct numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select ta.task_id, t.category, t.difficulty, count(*),
      round(100.0 * sum(case when ta.is_correct then 1 else 0 end) / nullif(count(*), 0), 1)
    from task_attempts ta
    join tasks t on t.id = ta.task_id
    group by ta.task_id, t.category, t.difficulty
    having count(*) >= min_attempts
    order by 5 asc
    limit limit_count;
end;
$$;

create or replace function admin_recent_signups(limit_count int default 10)
returns table(display_name text, email text, tier text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select u.display_name, u.email, u.tier, u.created_at
    from users u
    order by u.created_at desc
    limit limit_count;
end;
$$;

create or replace function admin_referral_leaderboard(limit_count int default 10)
returns table(display_name text, email text, referral_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select u.display_name, u.email, count(r.id)
    from users u
    join users r on r.referred_by = u.id
    group by u.id, u.display_name, u.email
    order by 3 desc
    limit limit_count;
end;
$$;

create or replace function admin_recent_errors(limit_count int default 20)
returns table(error_type text, error_message text, occurred_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin();
  return query
    select e.error_type, e.error_message, e.occurred_at
    from errors e
    order by e.occurred_at desc
    limit limit_count;
end;
$$;

grant execute on function admin_overview() to authenticated;
grant execute on function admin_signups_by_day(int) to authenticated;
grant execute on function admin_tier_distribution() to authenticated;
grant execute on function admin_task_accuracy_by_confidence() to authenticated;
grant execute on function admin_task_activity_by_day(int) to authenticated;
grant execute on function admin_buddy_usage_by_day(int) to authenticated;
grant execute on function admin_buddy_source_split() to authenticated;
grant execute on function admin_hardest_tasks(int, int) to authenticated;
grant execute on function admin_recent_signups(int) to authenticated;
grant execute on function admin_referral_leaderboard(int) to authenticated;
grant execute on function admin_recent_errors(int) to authenticated;
