import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FieldMessage, TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chunky, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isValidEmail } from '@/lib/validation';
import { useAuth } from '@/state/auth';

const MIN_PASSWORD_LENGTH = 8;

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'sign-up';

  const handleSubmit = async () => {
    setNotice(null);
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
    }
    if (!password) return setError('Enter your password.');

    setError(null);
    setBusy(true);
    if (isSignUp) {
      const result = await signUp(email, password);
      if (result.error) setError(result.error);
      else if (result.needsConfirmation) {
        setNotice('Almost there! Check your email for a confirmation link, then sign in.');
        setMode('sign-in');
      }
      // Without email confirmation the new session arrives on its own and the app opens.
    } else {
      setError(await signIn(email, password));
    }
    setBusy(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <ThemedText type="title" style={styles.title}>
            KeyBud
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {isSignUp
              ? 'Create an account so your board and progress follow you to any device.'
              : 'Sign in to pick up where you left off.'}
          </ThemedText>

          {!isSupabaseConfigured ? (
            <ThemedView type="backgroundElement" style={[styles.setupCard, Chunky.key]}>
              <ThemedText type="smallBold">Supabase isn&apos;t set up yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Copy .env.example to .env.local, add your project URL and anon key, then restart the
                dev server. See supabase/README.md.
              </ThemedText>
            </ThemedView>
          ) : null}

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onSubmitEditing={handleSubmit}
          />

          {error ? <FieldMessage kind="error">{error}</FieldMessage> : null}
          {notice ? <FieldMessage kind="success">{notice}</FieldMessage> : null}

          <Button
            label={busy ? 'One moment...' : isSignUp ? 'Create account' : 'Sign in'}
            onPress={handleSubmit}
            disabled={busy || !isSupabaseConfigured}
          />
          <Button
            label={isSignUp ? 'I already have an account' : 'Create an account'}
            variant="secondary"
            onPress={() => {
              setMode(isSignUp ? 'sign-in' : 'sign-up');
              setError(null);
              setNotice(null);
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: { color: Palette.primary },
  setupCard: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
