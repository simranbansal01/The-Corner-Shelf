-- Which corner-buddy character shows up for this user (separate from
-- pet_choice/pet_size, which are the older companion-corner figurine
-- picks — pet_choice no longer affects the buddy icon at all, see
-- BuddyPanel.jsx). Niblet stays the default so existing users see no
-- change until they actually pick something in Settings.
alter table users
  add column if not exists buddy_character text
    check (buddy_character in ('niblet', 'sir-claws-a-lot'))
    default 'niblet' not null;
