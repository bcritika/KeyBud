import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardTile } from '@/components/board-tile';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, FunFont, MaxContentWidth, Spacing } from '@/constants/theme';
import type { BoardItem } from '@/data/board-items';
import { availableChannels, notifyContact, type NotifyChannel } from '@/lib/notify';
import { useAppState } from '@/state/app-state';

const COLUMNS = 3;
const GRID_GAP = Spacing.three;
const MAX_MESSAGE_LENGTH = 8;

export default function BoardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { boardItems, contact } = useAppState();
  const [message, setMessage] = useState<BoardItem[]>([]);

  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const tileSize = Math.floor((contentWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS);
  const words = message.map((item) => item.word);

  const handleTilePress = (item: BoardItem) => {
    Speech.stop();
    Speech.speak(item.word);
    setMessage((prev) => [...prev.slice(-(MAX_MESSAGE_LENGTH - 1)), item]);
  };

  const handleSpeak = () => {
    Speech.stop();
    Speech.speak(words.join(' '));
  };

  const send = async (channel: NotifyChannel) => {
    try {
      await notifyContact(contact, channel, words);
    } catch {
      Alert.alert('Could not open that app', 'Check that this device can send texts or email.');
    }
  };

  const handleSend = () => {
    const channels = availableChannels(contact);
    if (channels.length === 0) {
      Alert.alert('No one to notify yet', 'Add a phone number or email in Settings first.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => router.navigate('/settings') },
      ]);
    } else if (channels.length === 1) {
      send(channels[0]);
    } else {
      Alert.alert('Send this message', 'How should it be sent?', [
        { text: 'Text message', onPress: () => send('sms') },
        { text: 'Email', onPress: () => send('email') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            My Board
          </ThemedText>
          <Button label="Edit" variant="secondary" onPress={() => router.push('/edit-board')} style={styles.editButton} />
        </View>

        <ThemedView type="backgroundElement" style={styles.messageBar}>
          <ThemedText
            style={styles.messageText}
            themeColor={words.length ? 'text' : 'textSecondary'}
            accessibilityLiveRegion="polite">
            {words.length ? words.join(' ') : 'Tap pictures to build a message'}
          </ThemedText>
          <View style={styles.messageActions}>
            <Button label="Speak" onPress={handleSpeak} disabled={!words.length} style={styles.actionButton} />
            <Button label="Send" onPress={handleSend} disabled={!words.length} style={styles.actionButton} />
            <Button
              label="Clear"
              variant="secondary"
              onPress={() => setMessage([])}
              disabled={!words.length}
              style={styles.actionButton}
            />
          </View>
        </ThemedView>

        {boardItems.length ? (
          <ScrollView contentContainerStyle={styles.grid}>
            {boardItems.map((item) => (
              <BoardTile key={item.id} item={item} size={tileSize} onPress={() => handleTilePress(item)} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary" style={styles.centered}>
              Nothing on your board yet.
            </ThemedText>
            <Button label="Choose board items" onPress={() => router.push('/edit-board')} />
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerTitle: { fontFamily: FunFont.semiBold, fontWeight: 'normal' },
  editButton: { minHeight: 44, paddingHorizontal: Spacing.three },
  messageBar: {
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  messageText: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: FunFont.bold,
    fontWeight: 'normal',
    minHeight: 30,
    textTransform: 'capitalize',
  },
  messageActions: { flexDirection: 'row', gap: Spacing.two },
  actionButton: { flex: 1, minHeight: 48, paddingHorizontal: Spacing.two },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centered: { textAlign: 'center' },
});
