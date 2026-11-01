import { File } from 'expo-file-system';

import type { BoardItem } from '@/data/board-items';
import type { SyncResult } from '@/data/merge';
import type { PersistedState } from '@/data/persisted-state';
import { ensurePhotoDir, resolvePhotoUri } from '@/lib/images';
import { supabase } from '@/lib/supabase';

const PHOTO_BUCKET = 'board-photos';

type SettingsRow = {
  selected_ids: string[];
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  level: number;
  /** Consecutive clean (no-mistake) words since the last mistake or level up. */
  words_in_level: number;
  total_words: number;
  required_streak: number;
};

type ItemRow = {
  id: string;
  word: string;
  emoji: string | null;
  photo_file: string | null;
};

const photoPath = (userId: string, file: string) => `${userId}/${file}`;

const PHOTO_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};
const photoContentType = (file: string) =>
  PHOTO_TYPES[file.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/jpeg';

function rowToItem(row: ItemRow): BoardItem {
  return {
    id: row.id,
    word: row.word,
    isCustom: true,
    image: row.photo_file
      ? { kind: 'photo', file: row.photo_file }
      : { kind: 'emoji', value: row.emoji ?? '' },
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

async function uploadPhoto(userId: string, file: string) {
  const local = new File(resolvePhotoUri(file));
  if (!local.exists) return; // Nothing on this device to upload (e.g. already cleaned up).

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(photoPath(userId, file), await local.arrayBuffer(), {
      contentType: photoContentType(file),
      upsert: true,
    });
  throwIfError(error);
}

/**
 * One full sync: upload everything waiting in the outbox, then fetch the server's copy.
 * Every step is safe to repeat, so if it fails partway the next attempt just redoes it.
 */
export async function runSync(userId: string, snapshot: PersistedState): Promise<SyncResult> {
  const { outbox } = snapshot;

  let pushedSettingsRev: number | null = null;
  if (outbox.settingsRev !== outbox.syncedSettingsRev) {
    const { contact, progress } = snapshot;
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      selected_ids: snapshot.selectedIds,
      contact_name: contact.name,
      contact_phone: contact.phone,
      contact_email: contact.email,
      level: progress.level,
      words_in_level: progress.streak,
      total_words: progress.totalWords,
      required_streak: snapshot.requiredStreak,
      updated_at: new Date().toISOString(),
    });
    throwIfError(error);
    pushedSettingsRev = outbox.settingsRev;
  }

  for (const id of outbox.upserts) {
    const item = snapshot.customItems.find((custom) => custom.id === id);
    if (!item) continue;
    if (item.image.kind === 'photo') await uploadPhoto(userId, item.image.file);
    const { error } = await supabase.from('custom_items').upsert({
      id: item.id,
      user_id: userId,
      word: item.word,
      emoji: item.image.kind === 'emoji' ? item.image.value : null,
      photo_file: item.image.kind === 'photo' ? item.image.file : null,
    });
    throwIfError(error);
  }

  for (const { id, photoFile } of outbox.deletes) {
    const { error } = await supabase.from('custom_items').delete().eq('id', id);
    throwIfError(error);
    if (photoFile) {
      await supabase.storage.from(PHOTO_BUCKET).remove([photoPath(userId, photoFile)]);
    }
  }

  const [items, settings] = await Promise.all([
    supabase.from('custom_items').select('id, word, emoji, photo_file').eq('user_id', userId).order('created_at'),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle<SettingsRow>(),
  ]);
  throwIfError(items.error);
  throwIfError(settings.error);

  const row = settings.data;
  return {
    pushedSettingsRev,
    pushedUpserts: outbox.upserts,
    pushedDeletes: outbox.deletes.map(({ id }) => id),
    remoteItems: (items.data as ItemRow[]).map(rowToItem),
    remoteSettings: row && {
      selectedIds: row.selected_ids,
      contact: { name: row.contact_name, phone: row.contact_phone, email: row.contact_email },
      progress: { level: row.level, streak: row.words_in_level, totalWords: row.total_words },
      requiredStreak: row.required_streak,
    },
    syncedAt: new Date().toISOString(),
  };
}

/** Fetches photos for items created on other devices. Returns how many were downloaded. */
export async function downloadMissingPhotos(userId: string, items: BoardItem[]): Promise<number> {
  ensurePhotoDir();
  let downloaded = 0;

  for (const item of items) {
    if (item.image.kind !== 'photo') continue;
    const destination = new File(resolvePhotoUri(item.image.file));
    if (destination.exists) continue;

    try {
      const { data, error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(photoPath(userId, item.image.file), 60);
      throwIfError(error);
      await File.downloadFileAsync(data!.signedUrl, destination);
      downloaded++;
    } catch {
      // One photo failing (say, a dropped connection) shouldn't block the rest; it's retried next sync.
    }
  }
  return downloaded;
}
