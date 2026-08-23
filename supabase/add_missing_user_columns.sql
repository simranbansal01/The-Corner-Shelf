-- The live users table was missing pet_choice, pet_size, and path_message
-- entirely (schema.sql defines them, but they were never applied to this
-- project): causing onboarding to fail with "Could not find the
-- 'path_message' column of 'users' in the schema cache" on every submit,
-- and silently discarding pet selections (falling back to the 'sprout'
-- default client-side instead of erroring, which is why the failure went
-- unnoticed for pet_choice specifically). Safe to re-run.

alter table users add column if not exists pet_choice text check (pet_choice in ('sprout','fox','owl','cat')) default 'sprout';
alter table users add column if not exists pet_size numeric check (pet_size between 0.7 and 1.6) default 1;
alter table users add column if not exists path_message text;
