import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Stepper } from '@/components/stepper';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { describeLevel, MAX_LEVEL, MAX_REQUIRED_STREAK, MIN_REQUIRED_STREAK } from '@/game/levels';
import { colorForKey } from '@/lib/kid-colors';
import { cleanPhone, isValidEmail, isValidPhone } from '@/lib/validation';
import { useAppState, type Contact, type SyncStatus } from '@/state/app-state';
import { useAuth } from '@/state/auth';

const LEVEL_NUMBERS = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1);

function describeSync(status: SyncStatus, pending: number, lastSyncedAt: string | null) {
  const changes = `${pending} ${pending === 1 ? 'change' : 'changes'}`;
  if (status === 'syncing') return 'Syncing...';
  if (status === 'error') {
    return pending
      ? `Offline. ${changes} saved on this device and will sync when you're back online.`
      : "Can't reach the server right now. Everything you see is saved on this device.";
  }
  if (pending) return `${changes} waiting to sync.`;
  if (!lastSyncedAt) return 'Up to date.';
  const time = new Date(lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `Up to date. Last synced at ${time}.`;
}

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const {
    contact,
    setContact,
    progress,
    requiredStreak,
    setRequiredStreak,
    resetProgress,
    syncStatus,
    pendingChanges,
    lastSyncedAt,
    syncNow,
  } = useAppState();
  // Fields show the saved contact until edited, so a contact arriving from the cloud after this
  // screen opens still appears, and saving never overwrites it with stale blanks.
  const [draft, setDraft] = useState<Partial<Contact>>({});
  const { name, phone, email } = { ...contact, ...draft };
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Both fields are optional, but whatever is filled in has to look right.
    const nextErrors = {
      phone: phone.trim() && !isValidPhone(phone) ? 'Enter a valid phone number.' : undefined,
      email: email.trim() && !isValidEmail(email) ? 'Enter a valid email address.' : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.email) {
      setSaved(false);
      return;
    }
    setContact({ name: name.trim(), phone: cleanPhone(phone), email: email.trim() });
    setDraft({});
    setSaved(true);
  };

  const handleReset = () => {
    Alert.alert('Start over?', `This sets you back to level 1. You're on level ${progress.level} now.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset progress', style: 'destructive', onPress: resetProgress },
    ]);
  };

  const handleSignOut = () => {
    const warning = pendingChanges
      ? `${pendingChanges} ${pendingChanges === 1 ? 'change hasn' : 'changes haven'}'t synced yet. They stay saved on this device and upload the next time you sign in.`
      : 'You can sign back in any time to get your board and progress.';
    Alert.alert('Sign out?', warning, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const edit = (field: keyof Contact) => (text: string) => {
    setDraft((prev) => ({ ...prev, [field]: text }));
    setSaved(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <ThemedText type="subtitle" style={styles.title}>
            Settings
          </ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary">
            WHO TO NOTIFY
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            When a message is built on the board, Send opens your text or email app with it ready
            to go for this person.
          </ThemedText>
          <TextField
            label="Name (optional)"
            value={name}
            onChangeText={edit('name')}
            autoCapitalize="words"
            placeholder="Mom"
          />
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={edit('phone')}
            keyboardType="phone-pad"
            placeholder="555 123 4567"
            error={errors.phone}
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={edit('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="name@example.com"
            error={errors.email}
          />
          <Button label="Save" onPress={handleSave} />
          {saved ? (
            <ThemedText style={styles.saved} accessibilityLiveRegion="polite">
              Saved
            </ThemedText>
          ) : null}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionGap}>
            LEVELS
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Choose how many words in a row, with no mistakes, it takes to reach the next level. Any
            mistake resets that count back to zero.
          </ThemedText>
          <Stepper
            label="Correct attempts to level up"
            value={requiredStreak}
            min={MIN_REQUIRED_STREAK}
            max={MAX_REQUIRED_STREAK}
            onChange={setRequiredStreak}
          />
          <ThemedView type="backgroundElement" style={styles.levelList}>
            {LEVEL_NUMBERS.map((level) => (
              <View key={level} style={styles.levelRow}>
                <View style={[styles.levelNumber, { backgroundColor: colorForKey(`level-${level}`) }]}>
                  <Text style={styles.levelNumberText}>{level}</Text>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                  {describeLevel(level, requiredStreak)}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
          <Button label="Reset to level 1" variant="danger" onPress={handleReset} />

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionGap}>
            ACCOUNT
          </ThemedText>
          <ThemedText>{session?.user.email}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
            {describeSync(syncStatus, pendingChanges, lastSyncedAt)}
          </ThemedText>
          <Button
            label="Sync now"
            variant="secondary"
            onPress={syncNow}
            disabled={syncStatus === 'syncing'}
          />
          <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
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
    paddingBottom: BottomTabInset + Spacing.four,
  },
  title: { fontFamily: FunFont.semiBold, fontWeight: 'normal' },
  saved: { color: Palette.success, fontWeight: 700, textAlign: 'center' },
  sectionGap: { marginTop: Spacing.three },
  levelList: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  levelNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumberText: { fontSize: 14, fontFamily: FunFont.bold, color: Palette.onAccent },
  flex: { flex: 1 },
});
