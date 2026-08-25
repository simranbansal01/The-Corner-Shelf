-- Adds Glitchy as a third buddy_character option (see add_buddy_character.sql
-- for the original niblet/sir-claws-a-lot constraint). Postgres has no
-- ALTER CONSTRAINT, so drop and recreate with the expanded list.
alter table users
  drop constraint if exists users_buddy_character_check;

alter table users
  add constraint users_buddy_character_check
    check (buddy_character in ('niblet', 'sir-claws-a-lot', 'glitchy'));
