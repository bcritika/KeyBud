-- KeyBud schema: one settings row per user, plus the user's own custom board items.
-- Run in the Supabase SQL editor, or with the Supabase CLI: `supabase db push`.

create table public.user_settings (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- Ids of the items on the board, in order. Ready-made items use ids like 'default-help'.
  selected_ids   text[] not null default '{}',
  contact_name   text not null default '',
  contact_phone  text not null default '',
  contact_email  text not null default '',
  level          int not null default 1 check (level >= 1),
  words_in_level int not null default 0 check (words_in_level >= 0),
  total_words    int not null default 0 check (total_words >= 0),
  updated_at     timestamptz not null default now()
);

create table public.custom_items (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  word       text not null check (word ~ '^[a-z]{2,12}$'),
  -- Exactly one of these is set: a built-in emoji, or the name of an uploaded photo.
  emoji      text check (char_length(emoji) <= 16),
  photo_file text check (photo_file ~ '^[A-Za-z0-9._-]+$'),
  created_at timestamptz not null default now(),
  check ((emoji is null) <> (photo_file is null))
);

create index custom_items_user_id_idx on public.custom_items (user_id, created_at);

-- Row level security: the app talks to the database directly with a public key,
-- so these policies are what keep each person's data private.
alter table public.user_settings enable row level security;
alter table public.custom_items enable row level security;

create policy "Users manage their own settings" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own items" on public.custom_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Private bucket for uploaded board photos, stored as <user id>/<file name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'board-photos',
  'board-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Users manage photos in their own folder" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'board-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'board-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
