import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SELECTED_IDS, type BoardItem } from '@/data/board-items';
import { DEFAULT_REQUIRED_STREAK, INITIAL_PROGRESS, type Progress } from '@/game/levels';

export type Contact = { name: string; phone: string; email: string };

/**
 * Changes made on this device that the server hasn't seen yet. Recording changes as they
 * happen (instead of diffing later) lets the app work fully offline and catch up afterwards.
 */
export type Outbox = {
  /** Bumped on every change to the board order, contact, or progress. */
  settingsRev: number;
  /** The settingsRev the server last received. They differ while settings are unsynced. */
  syncedSettingsRev: number;
  /** Custom items created here, waiting to be uploaded. */
  upserts: string[];
  /** Custom items deleted here, waiting to be deleted on the server. */
  deletes: { id: string; photoFile?: string }[];
};

/** Everything the app remembers for one signed-in user. This is what the local cache stores. */
export type PersistedState = {
  customItems: BoardItem[];
  selectedIds: string[];
  contact: Contact;
  progress: Progress;
  /** How many clean words in a row it takes to level up (see game/levels.ts). */
  requiredStreak: number;
  outbox: Outbox;
  lastSyncedAt: string | null;
};

export const EMPTY_OUTBOX: Outbox = { settingsRev: 0, syncedSettingsRev: 0, upserts: [], deletes: [] };

export const INITIAL_STATE: PersistedState = {
  customItems: [],
  selectedIds: DEFAULT_SELECTED_IDS,
  contact: { name: '', phone: '', email: '' },
  progress: INITIAL_PROGRESS,
  requiredStreak: DEFAULT_REQUIRED_STREAK,
  outbox: EMPTY_OUTBOX,
  lastSyncedAt: null,
};

// One cache per user, so signing in as someone else never shows or overwrites another's data.
// Bumped to v3 because `progress` changed shape (wordsInLevel -> streak): the server resyncs
// whatever a v2 cache would have held, so there's nothing to migrate by hand.
const cacheKey = (userId: string) => `keybud/state/v3/${userId}`;

export async function loadCache(userId: string): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return INITIAL_STATE;
    const saved = JSON.parse(raw);
    return { ...INITIAL_STATE, ...saved, outbox: { ...EMPTY_OUTBOX, ...saved.outbox } };
  } catch {
    // Unreadable cache: start from defaults and let the next sync restore it from the server.
    return INITIAL_STATE;
  }
}

export function saveCache(userId: string, state: PersistedState) {
  return AsyncStorage.setItem(cacheKey(userId), JSON.stringify(state)).catch(() => {});
}
