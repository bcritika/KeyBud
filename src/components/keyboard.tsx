import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DRAG_LIFT } from '@/components/drag-ghost';
import { FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { KEYBOARD_ROWS } from '@/game/levels';
import { useTheme } from '@/hooks/use-theme';
import { colorForKey } from '@/lib/kid-colors';

const KEY_GAP = 5;
const KEY_HEIGHT = 54;

type Point = { x: number; y: number };

type KeyboardProps = {
  /** Keys that can be dragged. Every other key is dimmed. */
  highlighted: Set<string>;
  draggingLetter: string | null;
  /** Finger position, relative to the overlay the DragGhost is drawn in. */
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  /** Where that overlay sits in window coordinates. */
  origin: SharedValue<Point>;
  onDragStart: (letter: string) => void;
  /** Called with the window position of the dragged letter when the finger lifts. */
  onDrop: (letter: string, x: number, y: number) => void;
  onDragEnd: () => void;
  /** Called when a dimmed (not-highlighted) key is tapped. */
  onBlockedPress: (letter: string) => void;
};

export function Keyboard({ highlighted, draggingLetter, onBlockedPress, ...dragProps }: KeyboardProps) {
  const { width } = useWindowDimensions();
  const rowWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const keyWidth = Math.floor((rowWidth - KEY_GAP * 9) / 10);

  return (
    <View style={styles.keyboard} accessibilityLabel="Keyboard">
      {KEYBOARD_ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((letter) => (
            <LetterKey
              key={letter}
              letter={letter}
              width={keyWidth}
              isHighlighted={highlighted.has(letter)}
              isDragging={draggingLetter === letter}
              onBlockedPress={onBlockedPress}
              {...dragProps}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

type LetterKeyProps = Pick<
  KeyboardProps,
  'ghostX' | 'ghostY' | 'origin' | 'onDragStart' | 'onDrop' | 'onDragEnd' | 'onBlockedPress'
> & {
  letter: string;
  width: number;
  isHighlighted: boolean;
  isDragging: boolean;
};

function LetterKey({
  letter,
  width,
  isHighlighted,
  isDragging,
  ghostX,
  ghostY,
  origin,
  onDragStart,
  onDrop,
  onDragEnd,
  onBlockedPress,
}: LetterKeyProps) {
  const theme = useTheme();

  if (!isHighlighted) {
    // Tapping a key that isn't part of this round shows the X, and nothing else.
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Letter ${letter}, not needed`}
        onPress={() => onBlockedPress(letter)}
        style={[styles.key, { width, backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.letter, { color: theme.textSecondary, opacity: 0.45 }]}>
          {letter.toUpperCase()}
        </Text>
      </Pressable>
    );
  }

  const pan = Gesture.Pan()
    .minDistance(2)
    .onStart((event) => {
      ghostX.set(event.absoluteX - origin.get().x);
      ghostY.set(event.absoluteY - origin.get().y);
      scheduleOnRN(onDragStart, letter);
    })
    .onUpdate((event) => {
      ghostX.set(event.absoluteX - origin.get().x);
      ghostY.set(event.absoluteY - origin.get().y);
    })
    .onEnd((event, success) => {
      if (success) scheduleOnRN(onDrop, letter, event.absoluteX, event.absoluteY - DRAG_LIFT);
    })
    .onFinalize(() => {
      scheduleOnRN(onDragEnd);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Letter ${letter}, drag to a square`}
        style={[
          styles.key,
          { width, backgroundColor: colorForKey(letter) },
          isDragging && styles.dragging,
        ]}>
        <Text style={[styles.letter, { color: Palette.onAccent }]}>{letter.toUpperCase()}</Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    alignItems: 'center',
    gap: KEY_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: KEY_GAP,
  },
  key: {
    height: KEY_HEIGHT,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 22,
    fontFamily: FunFont.bold,
  },
  dragging: {
    opacity: 0.35,
  },
});
