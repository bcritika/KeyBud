-- Lets a signed-in user permanently delete their own account from inside the app (App Store
-- guideline 5.1.1(v) requires this for any app that lets people create an account).
--
-- The app deletes the user's photos from storage first (Supabase doesn't allow deleting stored
-- files with SQL), then calls this. Removing the auth.users row deletes their user_settings
-- and custom_items rows too, through those tables' `on delete cascade` foreign keys.
--
-- security definer runs this with its owner's rights, which can delete from auth.users. It only
-- ever deletes the row for auth.uid(), the caller themselves, so no one can delete anyone else.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

notify pgrst, 'reload schema';
