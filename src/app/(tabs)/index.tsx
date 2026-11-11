import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ProgressDots } from '@/components/progress-dots';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Chunky, FunFont, KEY_OUTLINE, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { describeLevel, MAX_LEVEL } from '@/game/levels';
import { colorForKey } from '@/lib/kid-colors';
import { useAppState } from '@/state/app-state';

export default function HomeScreen() {
  const router = useRouter();
  const { progress, requiredStreak, boardItems } = useAppState();
  const hasItems = boardItems.length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>
            KeyBud
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Learn the keyboard by spelling the words on your communication board.
          </ThemedText>

          <ThemedView type="backgroundElement" style={[styles.levelCard, Chunky.key]}>
            <View style={styles.levelCardHeader}>
              <View style={[styles.levelBadge, { backgroundColor: colorForKey(`level-${progress.level}`) }]}>
                <Text style={styles.levelBadgeNumber}>{progress.level}</Text>
              </View>
              <View style={styles.levelCardHeading}>
                <ThemedText type="subtitle" style={styles.levelCardTitle}>
                  Level {progress.level}
                </ThemedText>
                {progress.level < MAX_LEVEL ? (
                  <ProgressDots filled={progress.streak} total={requiredStreak} />
                ) : null}
              </View>
            </View>
            <ThemedText themeColor="textSecondary">{describeLevel(progress.level, requiredStreak)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {progress.totalWords} {progress.totalWords === 1 ? 'word' : 'words'} spelled so far
            </ThemedText>
          </ThemedView>

          <Button label="Start learning" onPress={() => router.push('/learn')} disabled={!hasItems} />
          {!hasItems ? (
            <ThemedText type="small" themeColor="textSecondary">
              Your board is empty. Choose some items first, then come back to practice.
            </ThemedText>
          ) : null}
          <Button
            label="Choose board items"
            variant="secondary"
            onPress={() => router.push('/edit-board')}
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
    paddingBottom: BottomTabInset + Spacing.four,
  },
  title: { color: Palette.primary },
  levelCard: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: KEY_OUTLINE,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeNumber: { fontSize: 26, lineHeight: 34, fontFamily: FunFont.extraBold, color: Palette.onAccent },
  levelCardHeading: { gap: Spacing.one },
  levelCardTitle: { fontFamily: FunFont.semiBold },
});
