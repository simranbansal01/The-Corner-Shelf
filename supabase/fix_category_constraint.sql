-- Fixes a stale check constraint on tasks.category. If your Supabase project's
-- tasks table was created before 'tools' was added as a task category, this
-- constraint may still only allow the original 4: causing every 'tools_*'
-- task to fail insertion with a 23514 error. This drops and recreates it
-- with the correct, current list. Safe to run even if it's already correct.

alter table tasks drop constraint if exists tasks_category_check;
alter table tasks add constraint tasks_category_check
  check (category in ('writing','data','research','policy','tools'));
