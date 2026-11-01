import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False until .env.local is filled in; the sign-in screen explains what's missing. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// createClient throws on empty values, so unconfigured builds get inert placeholders
// and never make a request (the sign-in screen blocks on isSupabaseConfigured).
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'not-configured', {
  auth: {
    // The session lives on the device, so the app opens already signed in, even offline.
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Token refresh timers only make sense while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
