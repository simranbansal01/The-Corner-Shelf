-- Feedback prompt shown once a chapter's Quick Check is fully answered (see
-- ChapterScorePage): a 1-5 rating plus an optional "what should be
-- improved" note. Mirrors real_work_reflections' shape/RLS for free-text
-- user content. Safe to re-run.

create table if not exists quiz_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  stage_id text not null,
  chapter_key text not null,
  rating int not null check (rating between 1 and 5),
  improve_text text,
  submitted_at timestamptz not null default now()
);

alter table quiz_feedback enable row level security;

drop policy if exists "own feedback" on quiz_feedback;
create policy "own feedback" on quiz_feedback for all using (auth.uid() = user_id);
