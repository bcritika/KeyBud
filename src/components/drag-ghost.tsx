import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Chunky, FunFont, Palette } from '@/constants/theme';
import { colorForKey } from '@/lib/kid-colors';

/** The dragged letter floats this far above the finger so the finger doesn't cover it. */
export const DRAG_LIFT = 48;

type DragGhostProps = {
  letter: string | null;
  /** The size of a key on the keyboard, so the picked-up copy matches it. */
  size: { width: number; height: number };
  /** Finger position relative to the overlay this ghost is rendered in. */
  x: SharedValue<number>;
  y: SharedValue<number>;
};

/**
 * The picked-up key that follows the finger while a letter is being dragged: the same key,
 * tilted -4 degrees, scaled to 1.05 and floating on a deeper shadow. The tilt and scale are
 * fixed, not animated, so they need no reduced-motion handling.
 */
export function DragGhost({ letter, size, x, y }: DragGhostProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() - size.width / 2 },
      { translateY: y.get() - size.height / 2 - DRAG_LIFT },
      ...Chunky.lifted.transform,
    ],
  }));

  if (!letter) return null;

  return (
    <Animated.View
      pointerEvents="none"
      // Matches the key's own color on the keyboard, so the letter doesn't change color mid-drag.
      style={[styles.ghost, Chunky.key, styles.liftedShadow, size, { backgroundColor: colorForKey(letter) }, animatedStyle]}>
      <Text style={styles.letter}>{letter.toUpperCase()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  liftedShadow: { boxShadow: Chunky.lifted.boxShadow },
  letter: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FunFont.extraBold,
    color: Palette.onAccent,
  },
});
