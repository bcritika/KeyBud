import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from '@expo-google-fonts/fredoka';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FunFont, Palette } from '@/constants/theme';
import { AppStateProvider, useAppState } from '@/state/app-state';
import { AuthProvider, useAuth } from '@/state/auth';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { session, loading } = useAuth();
  const { ready } = useAppState();
  // These are bundled asset files, not a network fetch, so this never blocks on connectivity.
  // If it somehow errors, fontsError still lets the app proceed on the system font instead of
  // hanging on the splash screen forever.
  const [fontsLoaded, fontsError] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });

  // The splash screen waits only for data already on the device (the saved session, this
  // user's cached board, and the display font), never the network, so the app opens instantly
  // even offline.
  const appReady = !loading && (!session || ready) && (fontsLoaded || !!fontsError);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: Palette.primary,
        headerTitleStyle: { fontFamily: FunFont.semiBold },
      }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* The learning screen is all about dragging, so no header and no swipe-back. */}
        <Stack.Screen name="learn" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="edit-board" options={{ title: 'Choose Board Items' }} />
        <Stack.Screen name="add-item" options={{ title: 'Add Your Own', presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <AppStateProvider>
            <RootStack />
          </AppStateProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
