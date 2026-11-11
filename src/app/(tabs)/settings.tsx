import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Stepper } from '@/components/stepper';
import { FieldMessage, TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VoicePicker } from '@/components/voice-picker';
import { BottomTabInset, Chunky, FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { describeLevel, MAX_LEVEL, MAX_REQUIRED_STREAK, MIN_REQUIRED_STREAK } from '@/game/levels';
import { useBoardGrid } from '@/hooks/use-board-grid';
import { useSpeak } from '@/hooks/use-speech';
import { colorForKey } from '@/lib/kid-colors';
import { cleanPhone, isValidEmail, isValidPhone } from '@/lib/validation';
import { useAppState, type Contact, type SyncStatus } from '@/state/app-state';
import { useAuth } from '@/state/auth';
import {
  MAX_SPEECH_RATE,
  MIN_GRID_COLUMNS,
  MIN_SPEECH_RATE,
  SPEECH_RATE_STEP,
  usePreferences,
} from '@/state/preferences';

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

function describeRate(rate: number) {
  if (rate < 1) return `${rate}× slower`;
  if (rate > 1) return `${rate}× faster`;
  return '1× normal';
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
    deleteAccount,
  } = useAppState();
  const { voiceId, speechRate, setPreferences } = usePreferences();
  const { columns, maxColumns } = useBoardGrid();
  const speak = useSpeak();
  // Fields show the saved contact until edited, so a contact arriving from the cloud after this
  // screen opens still appears, and saving never overwrites it with stale blanks.
  const [draft, setDraft] = useState<Partial<Contact>>({});
  const { name, phone, email } = { ...contact, ...draft };
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // On success the session ends and the app returns to the sign-in screen by itself.
      await deleteAccount();
    } catch {
      setDeleteError("Couldn't delete your account. Check your internet connection and try again.");
      setDeleting(false);
    }
  };

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
          <ThemedText type="subtitle">Settings</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary">
            BOARD AND VOICE
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            These are saved on this device only, since every device has its own screen size and voices.
          </ThemedText>
          <Stepper
            label="Pictures in each row"
            value={columns}
            min={MIN_GRID_COLUMNS}
            max={maxColumns}
            onChange={(gridColumns) => setPreferences({ gridColumns })}
          />
          <Stepper
            label="Speaking speed"
            value={speechRate}
            min={MIN_SPEECH_RATE}
            max={MAX_SPEECH_RATE}
            step={SPEECH_RATE_STEP}
            formatValue={(rate) => `${rate}×`}
            onChange={(rate) => setPreferences({ speechRate: rate })}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {describeRate(speechRate)}
          </ThemedText>
          <ThemedText type="smallBold">Voice</ThemedText>
          <VoicePicker voiceId={voiceId} onChange={(id) => setPreferences({ voiceId: id })} />
          <Button
            label="Hear this voice"
            variant="secondary"
            onPress={() => speak('Hi! I am your KeyBud voice.')}
          />

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionGap}>
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
          {saved ? <FieldMessage kind="success">Saved</FieldMessage> : null}

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
          <ThemedView type="backgroundElement" style={[styles.levelList, Chunky.key]}>
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

          {/* A confirm step on the screen itself rather than a pop-up, so it works on the web too. */}
          {confirmingDelete ? (
            <ThemedView type="backgroundElement" style={[styles.deleteCard, Chunky.key]}>
              <ThemedText type="smallBold">Delete your account for good?</ThemedText>
              <ThemedText type="small">
                This permanently deletes your account, your board, your own pictures and photos, your
                level and progress, and your contact details, on every device. It can&apos;t be undone.
              </ThemedText>
              {deleteError ? <FieldMessage kind="error">{deleteError}</FieldMessage> : null}
              <Button
                label={deleting ? 'Deleting...' : 'Yes, delete everything'}
                variant="danger"
                onPress={handleDeleteAccount}
                disabled={deleting}
              />
              <Button
                label="Keep my account"
                variant="secondary"
                onPress={() => {
                  setConfirmingDelete(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
              />
            </ThemedView>
          ) : (
            <Button label="Delete my account" variant="danger" onPress={() => setConfirmingDelete(true)} />
          )}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionGap}>
            PICTURE CREDITS
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pictograms by Sergio Palao, from ARASAAC (arasaac.org), owned by the Government of Aragón
            (Spain), and shared under the CC BY-NC-SA 4.0 license.
          </ThemedText>
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
  sectionGap: { marginTop: Spacing.three },
  levelList: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  deleteCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  levelNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumberText: { fontSize: 14, lineHeight: 20, fontFamily: FunFont.extraBold, color: Palette.onAccent },
  flex: { flex: 1 },
});
