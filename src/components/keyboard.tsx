import { useState } from 'react';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DRAG_LIFT } from '@/components/drag-ghost';
import { Chunky, FunFont, KEY_DEPTH, KEY_OUTLINE, Palette, Spacing } from '@/constants/theme';
import { KEYBOARD_ROWS } from '@/game/levels';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';
import { colorForKey } from '@/lib/kid-colors';

const KEY_GAP = 6;
const MIN_KEY_HEIGHT = 54;
const MAX_KEY_WIDTH = 112;

/**
 * The size of one letter key. The keyboard uses the full screen width, since ten keys across
 * is the tightest fit in the app. Shared with the DragGhost so a picked-up key keeps its size.
 */
export function useKeySize() {
  const { width } = useWindowDimensions();
  const touchTarget = useTouchTarget();
  const rowWidth = width - Spacing.three * 2;
  return {
    width: Math.min(MAX_KEY_WIDTH, Math.floor((rowWidth - KEY_GAP * 9) / 10)),
    height: Math.max(MIN_KEY_HEIGHT, touchTarget),
  };
}

type Point = { x: number; y: number };

type KeyboardProps = {
  /** Keys that can be dragged. Every other key is shown flat and dashed. */
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
  /** The tap alternative to dragging: a lit key was tapped instead of dragged. */
  onTap: (letter: string) => void;
  /** Called when a flat (not-highlighted) key is tapped. */
  onBlockedPress: (letter: string) => void;
};

export function Keyboard({ highlighted, draggingLetter, onBlockedPress, ...dragProps }: KeyboardProps) {
  const size = useKeySize();

  return (
    <View style={styles.keyboard} accessibilityLabel="Keyboard">
      {KEYBOARD_ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((letter) => (
            <LetterKey
              key={letter}
              letter={letter}
              size={size}
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
  'ghostX' | 'ghostY' | 'origin' | 'onDragStart' | 'onDrop' | 'onDragEnd' | 'onTap' | 'onBlockedPress'
> & {
  letter: string;
  size: { width: number; height: number };
  isHighlighted: boolean;
  isDragging: boolean;
};

function LetterKey({ isHighlighted, onBlockedPress, ...props }: LetterKeyProps) {
  return isHighlighted ? <LitKey {...props} /> : <FlatKey {...props} onBlockedPress={onBlockedPress} />;
}

/**
 * A key that isn't part of this round. Tapping it shows the X, and nothing else. These keys are
 * flat and dashed, not raised, so "not in play" never depends on color alone.
 */
function FlatKey({ letter, size, onBlockedPress }: Pick<LetterKeyProps, 'letter' | 'size' | 'onBlockedPress'>) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Letter ${letter}, not needed`}
      onPress={() => onBlockedPress(letter)}
      style={[styles.key, styles.flatKey, size, { borderColor: theme.textSecondary }]}>
      <Text style={[styles.letter, { color: theme.textSecondary }]}>{letter.toUpperCase()}</Text>
    </Pressable>
  );
}

/** A key in play: drag it onto a square, or tap it to fill the next empty square. */
function LitKey({
  letter,
  size,
  isDragging,
  ghostX,
  ghostY,
  origin,
  onDragStart,
  onDrop,
  onDragEnd,
  onTap,
}: Omit<LetterKeyProps, 'isHighlighted' | 'onBlockedPress'>) {
  const [pressed, setPressed] = useState(false);

  // These callbacks run on the UI thread, so the dragged copy follows the finger without
  // waiting on JavaScript; anything that touches React state is handed back with scheduleOnRN.
  const pan = usePanGesture({
    minDistance: 2,
    onBegin: () => {
      'worklet';
      scheduleOnRN(setPressed, true);
    },
    onActivate: (event) => {
      'worklet';
      ghostX.set(event.absoluteX - origin.get().x);
      ghostY.set(event.absoluteY - origin.get().y);
      scheduleOnRN(onDragStart, letter);
    },
    onUpdate: (event) => {
      'worklet';
      ghostX.set(event.absoluteX - origin.get().x);
      ghostY.set(event.absoluteY - origin.get().y);
    },
    onDeactivate: (event) => {
      'worklet';
      if (!event.canceled) scheduleOnRN(onDrop, letter, event.absoluteX, event.absoluteY - DRAG_LIFT);
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(setPressed, false);
      scheduleOnRN(onDragEnd);
    },
  });

  // A finger that lifts without moving is a tap, which places the letter without any dragging.
  const tap = useTapGesture({
    onDeactivate: (event) => {
      'worklet';
      if (!event.canceled) scheduleOnRN(onTap, letter);
    },
  });

  // The drag gets first claim on a touch; only if it never starts moving does it count as a tap.
  const gesture = useExclusiveGestures(pan, tap);

  return (
    <GestureDetector gesture={gesture}>
      <View
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Letter ${letter}`}
        accessibilityHint="Tap to put it in the next empty square, or drag it to a square."
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => onTap(letter)}
        style={[
          styles.key,
          Chunky.key,
          size,
          { backgroundColor: colorForKey(letter) },
          pressed && !isDragging && Chunky.pressed,
          isDragging && [Chunky.leftBehind, { boxShadow: 'none' }],
        ]}>
        <Text style={[styles.letter, { color: Palette.onAccent }]}>{letter.toUpperCase()}</Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    alignItems: 'center',
    // Room under each row for the keys' shadow, and for them to sink into it when pressed.
    gap: KEY_GAP + KEY_DEPTH,
  },
  row: {
    flexDirection: 'row',
    gap: KEY_GAP,
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatKey: {
    borderWidth: KEY_OUTLINE,
    borderStyle: 'dashed',
    borderRadius: Chunky.key.borderRadius,
  },
  letter: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FunFont.extraBold,
  },
});
