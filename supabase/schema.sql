-- Practice loop v1: complete schema.
-- Run this entire file, once, in Supabase's SQL Editor (SQL Editor -> New query -> paste all -> Run).

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  job_role_label text,
  onboarding_why text,
  onboarding_goal text check (onboarding_goal in ('current_role','switch_fields','general','other')),
  onboarding_goal_other text,
  self_rated_level text check (self_rated_level in ('beginner','comfortable','confident')),
  placement_score int,
  tier text check (tier in ('basic','intermediate','advanced')),
  pet_choice text check (pet_choice in ('sprout','fox','owl','cat')) default 'sprout',
  pet_size numeric check (pet_size between 0.7 and 1.6) default 1,
  path_message text,
  acquisition_source text,
  created_at timestamptz default now(),
  last_active_at timestamptz default now()
);

create table placement_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id text not null,
  selected_option text not null,
  is_correct boolean not null,
  answered_at timestamptz default now()
);

create table tasks (
  id text primary key,
  category text check (category in ('writing','data','research','policy','tools')),
  difficulty text check (difficulty in ('basic','intermediate','advanced')),
  prompt_scenario text not null,
  ai_output_shown text not null,
  has_flaw boolean not null,
  flaw_explanation text not null
);

create table task_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  task_id text references tasks(id),
  confidence text check (confidence in ('not_sure','somewhat_sure','very_sure')),
  user_judgment_text text,
  user_flagged_wrong boolean not null,
  is_correct boolean not null,
  started_at timestamptz default now(),
  submitted_at timestamptz default now()
);

create table trust_scores (
  user_id uuid primary key references users(id) on delete cascade,
  current_score numeric default 0,
  total_attempts int default 0,
  updated_at timestamptz default now()
);

create table buddy_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  context_screen text,
  context_task_id text,
  prompt_template_id text,
  opened_at timestamptz default now(),
  closed_at timestamptz
);

create table real_work_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  response_text text,
  submitted_at timestamptz,
  skipped_count int default 0
);

create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  event_name text not null,
  payload jsonb,
  occurred_at timestamptz default now()
);

create table errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  error_type text,
  error_message text,
  triggering_action text,
  occurred_at timestamptz default now()
);

-- Auto-updates trust score the instant a task is submitted.
-- This is the entire "backend" for the real-time trust score requirement:
-- no server, no function to deploy, it just runs inside Postgres.
create or replace function update_trust_score()
returns trigger as $$
begin
  insert into trust_scores (user_id, current_score, total_attempts, updated_at)
  values (
    new.user_id,
    (select round(100.0 * sum(case when is_correct then 1 else 0 end) / count(*), 1)
     from task_attempts where user_id = new.user_id),
    (select count(*) from task_attempts where user_id = new.user_id),
    now()
  )
  on conflict (user_id) do update
  set current_score = excluded.current_score,
      total_attempts = excluded.total_attempts,
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_trust_score
after insert on task_attempts
for each row execute function update_trust_score();

-- Row Level Security: this is what actually stops one user from reading another's data.
alter table users enable row level security;
create policy "own row" on users for all using (auth.uid() = id);

alter table placement_answers enable row level security;
create policy "own placement answers" on placement_answers for all using (auth.uid() = user_id);

alter table task_attempts enable row level security;
create policy "own attempts" on task_attempts for all using (auth.uid() = user_id);

alter table trust_scores enable row level security;
create policy "own score" on trust_scores for select using (auth.uid() = user_id);

alter table buddy_interactions enable row level security;
create policy "own buddy interactions" on buddy_interactions for all using (auth.uid() = user_id);

alter table real_work_reflections enable row level security;
create policy "own reflections" on real_work_reflections for all using (auth.uid() = user_id);

alter table events enable row level security;
create policy "insert own events" on events for insert with check (auth.uid() = user_id or user_id is null);

alter table errors enable row level security;
create policy "insert own errors" on errors for insert with check (auth.uid() = user_id or user_id is null);

alter table tasks enable row level security;
create policy "anyone can read tasks" on tasks for select using (true);
