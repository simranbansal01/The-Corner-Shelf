-- Tracks completion of the Learn module (video + notes + quiz) per user per
-- stage, mirroring how task_attempts tracks practice-task completion.
-- Completing it is what counts, not the quiz score, same non-punitive
-- philosophy as the rest of the app. Safe to re-run.

create table if not exists learn_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  stage_id text not null,
  quiz_score int,
  quiz_total int,
  completed_at timestamptz not null default now(),
  unique (user_id, stage_id)
);

alter table learn_progress enable row level security;

drop policy if exists "own row" on learn_progress;
create policy "own row" on learn_progress for all using (auth.uid() = user_id);
