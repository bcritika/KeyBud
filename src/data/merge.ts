import type { BoardItem } from '@/data/board-items';
import type { Contact, Outbox, PersistedState } from '@/data/persisted-state';
import type { Progress } from '@/game/levels';

/** What one round trip to the server did and returned. */
export type SyncResult = {
  /** The settingsRev that was uploaded, or null if settings didn't need uploading. */
  pushedSettingsRev: number | null;
  pushedUpserts: string[];
  pushedDeletes: string[];
  /** The server's custom items, oldest first, as fetched after the uploads. */
  remoteItems: BoardItem[];
  /** The server's settings, or null if this account has none yet. */
  remoteSettings: {
    selectedIds: string[];
    contact: Contact;
    progress: Progress;
    requiredStreak: number;
  } | null;
  syncedAt: string;
};

export const isSettingsDirty = (outbox: Outbox) => outbox.settingsRev !== outbox.syncedSettingsRev;

export const pendingCount = (outbox: Outbox) =>
  (isSettingsDirty(outbox) ? 1 : 0) + outbox.upserts.length + outbox.deletes.length;

/**
 * Folds a sync result into the current state. It works on the state as it is *now*, not as
 * it was when the sync started, so anything the user changed during the network round trip
 * is still pending afterwards instead of being lost.
 *
 * The rule throughout: changes still waiting in the outbox win over the server's copy;
 * everything else takes the server's copy.
 */
export function applySyncResult(prev: PersistedState, result: SyncResult): PersistedState {
  const pushedUpserts = new Set(result.pushedUpserts);
  const pushedDeletes = new Set(result.pushedDeletes);

  const outbox: Outbox = {
    settingsRev: prev.outbox.settingsRev,
    syncedSettingsRev: result.pushedSettingsRev ?? prev.outbox.syncedSettingsRev,
    upserts: prev.outbox.upserts.filter((id) => !pushedUpserts.has(id)),
    deletes: prev.outbox.deletes.filter(({ id }) => !pushedDeletes.has(id)),
  };

  const pendingUpserts = new Set(outbox.upserts);
  const pendingDeletes = new Set(outbox.deletes.map(({ id }) => id));

  const remoteVisible = result.remoteItems.filter((item) => !pendingDeletes.has(item.id));
  const remoteIds = new Set(remoteVisible.map((item) => item.id));
  const notUploadedYet = prev.customItems.filter(
    (item) => pendingUpserts.has(item.id) && !remoteIds.has(item.id),
  );

  const next: PersistedState = {
    ...prev,
    customItems: [...remoteVisible, ...notUploadedYet],
    outbox,
    lastSyncedAt: result.syncedAt,
  };

  if (isSettingsDirty(outbox)) return next;

  if (!result.remoteSettings) {
    // A brand-new account has no settings row: queue this device's values to create one.
    return { ...next, outbox: { ...outbox, settingsRev: outbox.settingsRev + 1 } };
  }
  return { ...next, ...result.remoteSettings };
}
