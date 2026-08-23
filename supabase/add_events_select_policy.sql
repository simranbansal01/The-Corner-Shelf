-- The events table was insert-only: not even the owning user could read
-- their own rows back. The Dashboard book's Buddy Scorecard and Your
-- Journey pages need to query real history from it. Safe as a normal RLS
-- policy since every row is already scoped by user_id. Safe to re-run.

drop policy if exists "select own events" on events;
create policy "select own events" on events for select using (auth.uid() = user_id);
