# Supabase setup

KeyBud keeps a copy of everything on the device (instant to open, works offline) and syncs
it to Supabase in the background so the board, photos and progress follow the user to any device.

## One-time setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run each file in `migrations/`, oldest first. (Or use the
   Supabase CLI: `supabase link` then `supabase db push`.) This creates the tables, the
   row-level-security policies that keep each user's data private, the private
   `board-photos` storage bucket, and the `delete_my_account` function behind the app's
   **Delete my account** button.
3. In **Project Settings > API**, copy the project URL and the `anon` public key.
4. Copy `.env.example` to `.env.local` at the project root and fill both values in.
5. Restart `npm start` (Expo reads env vars at startup).

### Email confirmation

By default Supabase emails a confirmation link after sign-up, and the app tells the user to
confirm and then sign in. For quicker testing you can turn this off under
**Authentication > Providers > Email > Confirm email**.

## How syncing works

- Every change is applied on the device instantly and saved to local storage, then queued.
- About a second later (and again on app open and whenever the app returns to the foreground)
  the queue is uploaded and the server's copy is fetched. If the device is offline the queue
  is kept and retried every 30 seconds.
- Changes waiting in the queue win over the server's copy. Otherwise the server's copy wins,
  so if two devices edit the same thing, the last one to sync wins.
- Uploaded photos are stored privately in the `board-photos` bucket under `<user id>/`, and
  are downloaded to other devices when they first see the item.

The code lives in `src/data/` (`merge.ts` decides what wins, `remote.ts` talks to Supabase,
`persisted-state.ts` is the local cache) and `src/state/app-state.tsx` runs the loop.
