-- Extends tasks.category to include the two new Tier 2/3 roadmap categories
-- ('agents' for the AI Agents tier, 'agentic_ai' for the Agentic AI tier).
-- Same pattern as fix_category_constraint.sql: run this before seed_tasks.sql
-- inserts any agents_*/agentic_* rows, or those inserts fail with a 23514 error.

alter table tasks drop constraint if exists tasks_category_check;
alter table tasks add constraint tasks_category_check
  check (category in ('writing','data','research','policy','tools','agents','agentic_ai'));
