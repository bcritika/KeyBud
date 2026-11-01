import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { FunFont, Palette } from '@/constants/theme';
import { colorForKey } from '@/lib/kid-colors';

export const GHOST_SIZE = 64;
/** The dragged letter floats this far above the finger so the finger doesn't cover it. */
export const DRAG_LIFT = 48;

type DragGhostProps = {
  letter: string | null;
  /** Finger position relative to the overlay this ghost is rendered in. */
  x: SharedValue<number>;
  y: SharedValue<number>;
};

/** The enlarged letter that follows the finger while a key is being dragged. */
export function DragGhost({ letter, x, y }: DragGhostProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() - GHOST_SIZE / 2 },
      { translateY: y.get() - GHOST_SIZE / 2 - DRAG_LIFT },
    ],
  }));

  if (!letter) return null;

  return (
    <Animated.View
      pointerEvents="none"
      // Matches the key's own color on the keyboard, so the letter doesn't change color mid-drag.
      style={[styles.ghost, { backgroundColor: colorForKey(letter) }, animatedStyle]}>
      <Text style={styles.letter}>{letter.toUpperCase()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: GHOST_SIZE,
    height: GHOST_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  letter: {
    fontSize: 36,
    fontFamily: FunFont.bold,
    color: Palette.onAccent,
  },
});
