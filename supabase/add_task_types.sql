-- Adds support for multiple practice-task exercise types (scenario_decision,
-- troubleshooting, step_ordering) alongside the original flaw_spot format.
-- The tasks table's only real job is being an FK target for
-- task_attempts.task_id (content is served from src/lib/tasks.js, not read
-- from the DB), so relaxing its flaw_spot-specific NOT NULLs is safe. Safe
-- to re-run.

alter table tasks add column if not exists type text not null default 'flaw_spot';
alter table tasks alter column ai_output_shown drop not null;
alter table tasks alter column has_flaw drop not null;
alter table tasks alter column flaw_explanation drop not null;

-- user_flagged_wrong only applies to flaw_spot attempts now; user_answer
-- holds the selected option id (scenario_decision/troubleshooting) or a
-- JSON-stringified step order (step_ordering) for the new types.
alter table task_attempts alter column user_flagged_wrong drop not null;
alter table task_attempts add column if not exists user_answer text;
