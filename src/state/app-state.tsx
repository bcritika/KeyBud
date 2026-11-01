import { randomUUID } from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState as NativeAppState } from 'react-native';

import { DEFAULT_ITEMS, type BoardItem } from '@/data/board-items';
import { applySyncResult, pendingCount } from '@/data/merge';
import {
  INITIAL_STATE,
  loadCache,
  saveCache,
  type Contact,
  type Outbox,
  type PersistedState,
} from '@/data/persisted-state';
import { downloadMissingPhotos, runSync } from '@/data/remote';
import {
  advanceProgress,
  INITIAL_PROGRESS,
  MAX_REQUIRED_STREAK,
  MIN_REQUIRED_STREAK,
  resetStreak,
  type Progress,
} from '@/game/levels';
import { useLatest } from '@/hooks/use-latest';
import { deletePhoto } from '@/lib/images';
import { useAuth } from '@/state/auth';

export type { Contact } from '@/data/persisted-state';

/** 'error' means the last attempt couldn't reach the server (usually just offline). */
export type SyncStatus = 'idle' | 'syncing' | 'error';

type AppState = {
  /** False until this user's saved data has been read from the device (not from the network). */
  ready: boolean;
  /** Every item the user can pick from: the defaults plus their own. */
  allItems: BoardItem[];
  /** The items currently on the communication board, in the order they were added. */
  boardItems: BoardItem[];
  customItems: BoardItem[];
  contact: Contact;
  progress: Progress;
  /** How many clean words in a row the learner needs to level up. Adjustable in Settings. */
  requiredStreak: number;
  setRequiredStreak: (value: number) => void;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  /** How many changes are saved on this device but not yet on the server. */
  pendingChanges: number;
  /** Changes when photos finish downloading, so images that were missing re-render. */
  photosVersion: number;
  isOnBoard: (id: string) => boolean;
  toggleItem: (id: string) => void;
  /** Adds a custom item and puts it on the board. */
  addCustomItem: (item: Omit<BoardItem, 'id' | 'isCustom'>) => void;
  removeCustomItem: (id: string) => void;
  setContact: (contact: Contact) => void;
  /** Marks the current streak broken. Called the instant a wrong letter or key happens. */
  recordMistake: () => void;
  /** Records a finished word and reports whether it pushed the learner up a level. Only a
   * word finished with no mistakes (wasClean) can advance the streak or level. */
  recordWordCompleted: (wasClean: boolean) => { leveledUp: boolean; level: number };
  resetProgress: () => void;
  syncNow: () => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

/** How soon after a change we try to sync, and how often we retry while changes are waiting. */
const SYNC_DELAY_MS = 800;
const SYNC_RETRY_MS = 30_000;

/**
 * Applies a change and records it in the outbox so the next sync uploads it. Every change
 * touches the settings row (board order, contact, or progress); item changes also queue
 * their own upload or delete through the `outbox` argument.
 */
const withSettingsChange = (
  prev: PersistedState,
  patch: Partial<PersistedState>,
  outbox: Partial<Outbox> = {},
): PersistedState => ({
  ...prev,
  ...patch,
  outbox: { ...prev.outbox, settingsRev: prev.outbox.settingsRev + 1, ...outbox },
});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [state, setState] = useState<PersistedState>(INITIAL_STATE);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [photosVersion, setPhotosVersion] = useState(0);

  const ready = userId !== null && loadedFor === userId;

  // Kept in refs so callbacks used by drag-and-drop and timers always see the latest values.
  const latestState = useLatest(state);
  const progressRef = useLatest(state.progress);
  const requiredStreakRef = useLatest(state.requiredStreak);
  const syncing = useRef({ running: false, again: false });

  // Show the device's saved copy immediately. The network is never waited on to open the app.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadCache(userId).then((saved) => {
      if (cancelled) return;
      setState(saved);
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Write-through: every change lands on the device right away. The ready check stops the
  // defaults from overwriting saved data before it has loaded.
  useEffect(() => {
    if (ready && userId) saveCache(userId, state);
  }, [ready, userId, state]);

  const syncNow = useCallback(async () => {
    if (!userId || !ready) return;
    const guard = syncing.current;
    if (guard.running) {
      guard.again = true; // Something changed mid-sync: go around once more when it ends.
      return;
    }
    guard.running = true;
    setSyncStatus('syncing');
    try {
      do {
        guard.again = false;
        const result = await runSync(userId, latestState.current);
        setState((prev) => applySyncResult(prev, result));
        if ((await downloadMissingPhotos(userId, result.remoteItems)) > 0) {
          setPhotosVersion((version) => version + 1);
        }
      } while (guard.again);
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    } finally {
      guard.running = false;
    }
  }, [userId, ready, latestState]);

  // Pull the latest when the app opens and whenever it comes back to the foreground.
  useEffect(() => {
    if (!ready) return;
    const initial = setTimeout(syncNow, 0);
    const subscription = NativeAppState.addEventListener('change', (next) => {
      if (next === 'active') syncNow();
    });
    return () => {
      clearTimeout(initial);
      subscription.remove();
    };
  }, [ready, syncNow]);

  // Push changes shortly after they happen, and keep retrying while any are still waiting.
  const pending = pendingCount(state.outbox);
  useEffect(() => {
    if (!ready || pending === 0) return;
    const soon = setTimeout(syncNow, SYNC_DELAY_MS);
    const retry = setInterval(syncNow, SYNC_RETRY_MS);
    return () => {
      clearTimeout(soon);
      clearInterval(retry);
    };
    // The outbox object (not just its count) is a dependency so that a change made while
    // another is already pending still restarts the timer.
  }, [ready, pending, state.outbox, syncNow]);

  const allItems = useMemo(() => [...DEFAULT_ITEMS, ...state.customItems], [state.customItems]);

  const boardItems = useMemo(
    () =>
      state.selectedIds
        .map((id) => allItems.find((item) => item.id === id))
        .filter((item): item is BoardItem => item !== undefined),
    [state.selectedIds, allItems],
  );

  const isOnBoard = useCallback((id: string) => state.selectedIds.includes(id), [state.selectedIds]);

  const toggleItem = useCallback((id: string) => {
    setState((prev) =>
      withSettingsChange(prev, {
        selectedIds: prev.selectedIds.includes(id)
          ? prev.selectedIds.filter((selectedId) => selectedId !== id)
          : [...prev.selectedIds, id],
      }),
    );
  }, []);

  const addCustomItem = useCallback((item: Omit<BoardItem, 'id' | 'isCustom'>) => {
    const id = randomUUID();
    setState((prev) =>
      withSettingsChange(
        prev,
        {
          customItems: [...prev.customItems, { ...item, id, isCustom: true }],
          selectedIds: [...prev.selectedIds, id],
        },
        { upserts: [...prev.outbox.upserts, id] },
      ),
    );
  }, []);

  const removeCustomItem = useCallback(
    (id: string) => {
      const item = state.customItems.find((custom) => custom.id === id);
      const photoFile = item?.image.kind === 'photo' ? item.image.file : undefined;
      if (photoFile) deletePhoto(photoFile);

      setState((prev) =>
        withSettingsChange(
          prev,
          {
            customItems: prev.customItems.filter((custom) => custom.id !== id),
            selectedIds: prev.selectedIds.filter((selectedId) => selectedId !== id),
          },
          {
            // If it was never uploaded there's nothing to delete remotely, but a delete is harmless.
            upserts: prev.outbox.upserts.filter((upsertId) => upsertId !== id),
            deletes: [...prev.outbox.deletes, { id, photoFile }],
          },
        ),
      );
    },
    [state.customItems],
  );

  const setContact = useCallback((contact: Contact) => {
    setState((prev) => withSettingsChange(prev, { contact }));
  }, []);

  const recordMistake = useCallback(() => {
    setState((prev) => {
      const reset = resetStreak(prev.progress);
      return reset === prev.progress ? prev : withSettingsChange(prev, { progress: reset });
    });
  }, []);

  const recordWordCompleted = useCallback(
    (wasClean: boolean) => {
      const result = advanceProgress(progressRef.current, requiredStreakRef.current, wasClean);
      progressRef.current = result.progress;
      setState((prev) => withSettingsChange(prev, { progress: result.progress }));
      return { leveledUp: result.leveledUp, level: result.progress.level };
    },
    [progressRef, requiredStreakRef],
  );

  const resetProgress = useCallback(() => {
    setState((prev) => withSettingsChange(prev, { progress: INITIAL_PROGRESS }));
  }, []);

  const setRequiredStreak = useCallback((value: number) => {
    const clamped = Math.min(MAX_REQUIRED_STREAK, Math.max(MIN_REQUIRED_STREAK, Math.round(value)));
    setState((prev) =>
      prev.requiredStreak === clamped ? prev : withSettingsChange(prev, { requiredStreak: clamped }),
    );
  }, []);

  const value: AppState = {
    ready,
    allItems,
    boardItems,
    customItems: state.customItems,
    contact: state.contact,
    progress: state.progress,
    requiredStreak: state.requiredStreak,
    setRequiredStreak,
    syncStatus,
    lastSyncedAt: state.lastSyncedAt,
    pendingChanges: pending,
    photosVersion,
    isOnBoard,
    toggleItem,
    addCustomItem,
    removeCustomItem,
    setContact,
    recordMistake,
    recordWordCompleted,
    resetProgress,
    syncNow,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside <AppStateProvider>');
  return context;
}
