import { Baloo2_600SemiBold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Brand, FunFont, Palette } from '@/constants/theme';
import { AppStateProvider, useAppState } from '@/state/app-state';
import { AuthProvider, useAuth } from '@/state/auth';
import { PreferencesProvider } from '@/state/preferences';

SplashScreen.preventAutoHideAsync();

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.primary,
    background: Brand.paper,
    card: Brand.paper,
    text: Brand.ink,
    border: Brand.ink,
  },
};

function RootStack() {
  const { session, loading } = useAuth();
  const { ready } = useAppState();
  // These are bundled asset files, not a network fetch, so this never blocks on connectivity.
  // If it somehow errors, fontsError still lets the app proceed on the system font instead of
  // hanging on the splash screen forever.
  const [fontsLoaded, fontsError] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_800ExtraBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // The splash screen waits only for data already on the device (the saved session, this
  // user's cached board, and the fonts), never the network, so the app opens instantly
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
        headerStyle: { backgroundColor: Brand.paper },
        headerTitleStyle: { fontFamily: FunFont.extraBold, color: Brand.ink },
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NavigationTheme}>
        <PreferencesProvider>
          <AuthProvider>
            <AppStateProvider>
              <RootStack />
            </AppStateProvider>
          </AuthProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
