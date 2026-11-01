-- Lets each user choose how many spelling attempts in a row, with no mistakes, are needed to
-- level up (see src/game/levels.ts). Existing rows default to 3, matching the original behavior.
alter table public.user_settings
  add column if not exists required_streak int not null default 3
    check (required_streak between 1 and 10);

-- words_in_level now counts a *clean* streak (mistakes reset it to 0), not just words seen.
comment on column public.user_settings.words_in_level is
  'Consecutive words spelled with no mistakes since the last mistake or level up.';

notify pgrst, 'reload schema';
