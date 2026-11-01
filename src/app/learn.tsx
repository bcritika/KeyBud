import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DragGhost } from '@/components/drag-ghost';
import { ItemImage } from '@/components/item-image';
import { Keyboard } from '@/components/keyboard';
import { LetterSlots } from '@/components/letter-slots';
import { ProgressDots } from '@/components/progress-dots';
import { ThemedText } from '@/components/themed-text';
import { WrongMark } from '@/components/wrong-mark';
import { FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import type { BoardItem } from '@/data/board-items';
import { describeLevel, highlightedLetters, MAX_LEVEL, showsGhostLetters } from '@/game/levels';
import { PHONETIC_SOUND } from '@/game/phonics';
import { useLatest } from '@/hooks/use-latest';
import { useSuccessFeedback } from '@/hooks/use-success-feedback';
import { useTheme } from '@/hooks/use-theme';
import { colorForKey } from '@/lib/kid-colors';
import { useAppState } from '@/state/app-state';

type Round = {
  item: BoardItem;
  /** One entry per letter: the letter placed there, or null while still empty. */
  filled: (string | null)[];
  /** The keys lit up (and so draggable) for this round. */
  lit: Set<string>;
};

type Rect = { x: number; y: number; width: number; height: number };

/** How far outside a square a drop still counts as landing on it. */
const DROP_FORGIVENESS = 14;

function startRound(items: BoardItem[], level: number, previousId?: string): Round | null {
  if (items.length === 0) return null;
  const candidates = items.length > 1 ? items.filter((item) => item.id !== previousId) : items;
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  const filled: (string | null)[] = item.word.split('').map(() => null);
  return { item, filled, lit: highlightedLetters(item.word, level) };
}

export default function LearnScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { boardItems, progress, requiredStreak, recordMistake, recordWordCompleted } = useAppState();
  const playSuccess = useSuccessFeedback();

  const [round, setRound] = useState(() => startRound(boardItems, progress.level));
  const [result, setResult] = useState<{ leveledUp: boolean; level: number } | null>(null);
  const [draggingLetter, setDraggingLetter] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);

  // Whether the current round has had zero mistakes so far. Only a clean round counts toward
  // the level-up streak; reset true at the start of every round, including the very first.
  const roundCleanRef = useRef(true);

  // Drag callbacks fire from the gesture system, possibly holding an older render's closure,
  // so they read the round and result through these always-current refs.
  const latestRound = useLatest(round);
  const latestResult = useLatest(result);

  const rootRef = useRef<View>(null);
  const slotNodes = useRef<(View | null)[]>([]);
  const slotRects = useRef<Rect[]>([]);

  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const origin = useSharedValue({ x: 0, y: 0 });

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => origin.set({ x, y }));
  }, [origin]);

  const registerSlot = useCallback((index: number, node: View | null) => {
    slotNodes.current[index] = node;
  }, []);

  // Gives a light tap and makes the letter's sound (not its name) the instant it's touched,
  // whether or not it turns out to be right.
  const announceLetter = useCallback((letter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Speech.stop();
    Speech.speak(PHONETIC_SOUND[letter] ?? letter);
  }, []);

  // Squares are measured when a drag starts, so the rects are right even after rotation or layout shifts.
  const handleDragStart = useCallback(
    (letter: string) => {
      announceLetter(letter);
      setDraggingLetter(letter);
      measureRoot();
      slotNodes.current.forEach((node, index) => {
        node?.measureInWindow((x, y, width, height) => {
          slotRects.current[index] = { x, y, width, height };
        });
      });
    },
    [announceLetter, measureRoot],
  );

  const handleDragEnd = useCallback(() => setDraggingLetter(null), []);

  // Any wrong letter, wherever it comes from, breaks this round's clean streak right away.
  const showWrong = useCallback(() => {
    roundCleanRef.current = false;
    recordMistake();
    setWrongCount((count) => count + 1);
  }, [recordMistake]);

  // Tapping a dimmed key still says its name, since that's part of learning the keyboard too.
  const handleBlockedPress = useCallback(
    (letter: string) => {
      announceLetter(letter);
      showWrong();
    },
    [announceLetter, showWrong],
  );

  const handleDrop = (letter: string, x: number, y: number) => {
    const current = latestRound.current;
    if (!current || latestResult.current) return;

    const index = current.item.word.split('').findIndex((_, i) => {
      const rect = slotRects.current[i];
      return (
        rect !== undefined &&
        x >= rect.x - DROP_FORGIVENESS &&
        x <= rect.x + rect.width + DROP_FORGIVENESS &&
        y >= rect.y - DROP_FORGIVENESS &&
        y <= rect.y + rect.height + DROP_FORGIVENESS
      );
    });
    // Dropped away from the squares, or onto one that's already filled: just snap back.
    if (index === -1 || current.filled[index] !== null) return;

    if (current.item.word[index] !== letter) {
      showWrong();
      return;
    }

    playSuccess();
    const filled = current.filled.map((placed, i) => (i === index ? letter : placed));
    setRound({ ...current, filled });
    if (filled.every((placed) => placed !== null)) setResult(recordWordCompleted(roundCleanRef.current));
  };

  // Say the finished word out loud once the chime has had a moment to play.
  useEffect(() => {
    if (!result || !round) return;
    const timer = setTimeout(() => Speech.speak(round.item.word), 500);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [result, round]);

  const handleNext = () => {
    slotRects.current = [];
    roundCleanRef.current = true;
    setResult(null);
    setRound(startRound(boardItems, progress.level, round?.item.id));
  };

  const atMaxLevel = progress.level >= MAX_LEVEL;

  return (
    <View
      ref={rootRef}
      onLayout={measureRoot}
      style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            onPress={() => router.back()}
            hitSlop={12}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <View style={styles.levelInfo}>
            <ThemedText type="smallBold">Level {progress.level}</ThemedText>
            {!atMaxLevel ? <ProgressDots filled={progress.streak} total={requiredStreak} /> : null}
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.levelDescription}>
          {describeLevel(progress.level, requiredStreak)}
        </ThemedText>

        {round ? (
          <>
            <View style={styles.body}>
              <View style={[styles.picture, { backgroundColor: colorForKey(round.item.id) }]}>
                <ItemImage image={round.item.image} size={140} />
              </View>
              <ThemedText themeColor="textSecondary">Drag the letters to spell it</ThemedText>
              <LetterSlots
                word={round.item.word}
                filled={round.filled}
                showGhost={showsGhostLetters(progress.level)}
                registerSlot={registerSlot}
              />
            </View>

            <View style={styles.keyboardArea}>
              <Keyboard
                highlighted={round.lit}
                draggingLetter={draggingLetter}
                ghostX={ghostX}
                ghostY={ghostY}
                origin={origin}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onBlockedPress={handleBlockedPress}
              />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <ThemedText type="subtitle" style={styles.centered}>
              Your board is empty
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centered}>
              Pick a few pictures to practice with.
            </ThemedText>
            <Button label="Choose board items" onPress={() => router.replace('/edit-board')} />
          </View>
        )}

        {result && round ? (
          <View style={[styles.celebration, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.celebrationTitle}>
              {result.leveledUp ? `🎉 Level up! Now on level ${result.level} 🎉` : '🌟 Great job! 🌟'}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.celebrationWord}>
              {round.item.word}
            </ThemedText>
            <Button label="Next word" onPress={handleNext} style={styles.nextButton} />
          </View>
        ) : null}
      </SafeAreaView>

      <DragGhost letter={draggingLetter} x={ghostX} y={ghostY} />
      <WrongMark trigger={wrongCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backText: { fontSize: 18, fontWeight: 700, color: Palette.primary },
  levelInfo: { alignItems: 'flex-end', gap: Spacing.one },
  levelDescription: { textAlign: 'center', paddingHorizontal: Spacing.four },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  picture: {
    width: 172,
    height: 172,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardArea: {
    paddingBottom: Spacing.three,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centered: { textAlign: 'center' },
  celebration: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    zIndex: 5,
  },
  celebrationTitle: { fontSize: 22, fontFamily: FunFont.bold, color: Palette.success, textAlign: 'center' },
  celebrationWord: { textTransform: 'capitalize', fontFamily: FunFont.bold, fontWeight: 'normal' },
  nextButton: { alignSelf: 'stretch', marginTop: Spacing.two },
});
