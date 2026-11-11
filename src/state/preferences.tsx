import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Settings that belong to this device rather than the account: the voices installed differ
 * from device to device, and a tablet and a phone want different grid sizes. So these are kept
 * on the device only and never synced.
 */
export type Preferences = {
  /** How many columns of pictures the board shows. */
  gridColumns: number;
  /** A voice identifier from expo-speech, or null for the device's default voice. */
  voiceId: string | null;
  /** 1 is normal speed. */
  speechRate: number;
};

export const MIN_GRID_COLUMNS = 2;
export const MAX_GRID_COLUMNS = 6;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 1.5;
export const SPEECH_RATE_STEP = 0.25;

const DEFAULT_PREFERENCES: Preferences = { gridColumns: 3, voiceId: null, speechRate: 1 };

const STORAGE_KEY = 'keybud/preferences/v1';

type PreferencesContextValue = Preferences & {
  setPreferences: (patch: Partial<Preferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Only write once the saved copy has been read, so the defaults never overwrite it.
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => {});
  }, [loaded, preferences]);

  const setPreferences = useCallback((patch: Partial<Preferences>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <PreferencesContext.Provider value={{ ...preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}
