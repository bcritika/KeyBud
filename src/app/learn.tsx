import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type HostInstance } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DragGhost } from '@/components/drag-ghost';
import { ItemImage } from '@/components/item-image';
import { Keyboard, useKeySize } from '@/components/keyboard';
import { LetterSlots } from '@/components/letter-slots';
import { ProgressDots } from '@/components/progress-dots';
import { ThemedText } from '@/components/themed-text';
import { WrongMark } from '@/components/wrong-mark';
import { Chunky, FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import type { BoardItem } from '@/data/board-items';
import { describeLevel, highlightedLetters, MAX_LEVEL, showsGhostLetters } from '@/game/levels';
import { PHONETIC_SOUND } from '@/game/phonics';
import { useLatest } from '@/hooks/use-latest';
import { useSpeak } from '@/hooks/use-speech';
import { useSuccessFeedback } from '@/hooks/use-success-feedback';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';
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
  const touchTarget = useTouchTarget();
  const keySize = useKeySize();
  const { boardItems, progress, requiredStreak, recordMistake, recordWordCompleted } = useAppState();
  const playSuccess = useSuccessFeedback();
  const speak = useSpeak();

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

  const rootRef = useRef<HostInstance>(null);
  const slotNodes = useRef<(HostInstance | null)[]>([]);
  const slotRects = useRef<Rect[]>([]);

  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const origin = useSharedValue({ x: 0, y: 0 });

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => origin.set({ x, y }));
  }, [origin]);

  const registerSlot = useCallback((index: number, node: HostInstance | null) => {
    slotNodes.current[index] = node;
  }, []);

  // Gives a light tap and makes the letter's sound (not its name) the instant it's touched,
  // whether or not it turns out to be right.
  const announceLetter = useCallback(
    (letter: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      speak(PHONETIC_SOUND[letter] ?? letter);
    },
    [speak],
  );

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

  /** Puts a letter in one square: the right letter fills it, a wrong one shows the X. */
  const placeLetter = (current: Round, letter: string, index: number) => {
    if (current.item.word[index] !== letter) {
      showWrong();
      return;
    }

    playSuccess();
    const filled = current.filled.map((placed, i) => (i === index ? letter : placed));
    setRound({ ...current, filled });
    if (filled.every((placed) => placed !== null)) setResult(recordWordCompleted(roundCleanRef.current));
  };

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
    placeLetter(current, letter, index);
  };

  // The tap alternative to dragging: a tapped key goes into the first empty square.
  const handleTap = (letter: string) => {
    const current = latestRound.current;
    if (!current || latestResult.current) return;
    announceLetter(letter);
    const index = current.filled.indexOf(null);
    if (index !== -1) placeLetter(current, letter, index);
  };

  // Say the finished word out loud once the chime has had a moment to play.
  useEffect(() => {
    if (!result || !round) return;
    const timer = setTimeout(() => speak(round.item.word), 500);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [result, round, speak]);

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
        <View style={[styles.column, styles.topBar]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              Chunky.key,
              { minHeight: touchTarget, minWidth: touchTarget, backgroundColor: theme.backgroundElement },
              pressed && Chunky.pressed,
            ]}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <View style={styles.levelInfo}>
            <ThemedText type="smallBold">Level {progress.level}</ThemedText>
            {!atMaxLevel ? <ProgressDots filled={progress.streak} total={requiredStreak} /> : null}
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={[styles.column, styles.levelDescription]}>
          {describeLevel(progress.level, requiredStreak)}
        </ThemedText>

        {round ? (
          <>
            <View style={[styles.column, styles.body]}>
              <View style={[styles.picture, Chunky.key, { backgroundColor: theme.backgroundElement }]}>
                <ItemImage image={round.item.image} size={140} />
              </View>
              <ThemedText themeColor="textSecondary">Drag or tap the letters to spell it</ThemedText>
              <LetterSlots
                word={round.item.word}
                filled={round.filled}
                showGhost={showsGhostLetters(progress.level)}
                registerSlot={registerSlot}
              />
            </View>

            {/* The keyboard spans the whole screen width, not the content column, so its keys
                can be as large as possible. */}
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
                onTap={handleTap}
                onBlockedPress={handleBlockedPress}
              />
            </View>
          </>
        ) : (
          <View style={[styles.column, styles.empty]}>
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
          <View style={styles.celebrationWrap}>
            <View style={[styles.celebration, Chunky.key, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.celebrationTitle}>
                {result.leveledUp ? `Level up! Now on level ${result.level}!` : 'Great job!'}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.celebrationWord}>
                {round.item.word}
              </ThemedText>
              <Button label="Next word" onPress={handleNext} style={styles.nextButton} />
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      <DragGhost letter={draggingLetter} size={keySize} x={ghostX} y={ghostY} />
      <WrongMark trigger={wrongCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  /** Everything but the keyboard stays in a centered column on wide screens. */
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  backButton: {
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, lineHeight: 24, fontFamily: FunFont.extraBold, color: Palette.primary },
  levelInfo: { alignItems: 'flex-end', gap: Spacing.one, flexShrink: 1 },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardArea: {
    paddingBottom: Spacing.four,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centered: { textAlign: 'center' },
  celebrationWrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.four,
    alignItems: 'center',
    zIndex: 5,
  },
  celebration: {
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  celebrationTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FunFont.extraBold,
    color: Palette.primary,
    textAlign: 'center',
  },
  celebrationWord: { textTransform: 'capitalize' },
  nextButton: { alignSelf: 'stretch', marginTop: Spacing.two },
});
