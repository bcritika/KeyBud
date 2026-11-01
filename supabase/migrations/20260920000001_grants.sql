-- Let signed-in users reach their tables through the Data API. Row level security (see the
-- first migration) still limits each user to their own rows, and signed-out visitors (the
-- `anon` role) get no access at all. Safe to run more than once.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.custom_items to authenticated;

-- Make the API pick up the new tables and permissions right away.
notify pgrst, 'reload schema';
