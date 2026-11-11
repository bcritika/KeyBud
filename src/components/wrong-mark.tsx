import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Palette } from '@/constants/theme';

/** How long the mark stays up when it's shown without animation. */
const STILL_DURATION_MS = 700;

/**
 * A big X that flashes over the screen each time `trigger` increases. It is deliberately
 * silent and haptic-free: a wrong answer gets a quiet visual "no", never a punishing one.
 * With reduce motion on, it simply appears and disappears instead of popping in.
 */
export function WrongMark({ trigger }: { trigger: number }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  // Reanimated skips straight to the end of animations under reduce motion, which would leave
  // the X invisible, so in that case it shows until a plain timer hides that trigger's mark.
  const [hiddenTrigger, setHiddenTrigger] = useState(0);
  const stillVisible = trigger !== hiddenTrigger;

  useEffect(() => {
    if (trigger === 0) return;
    if (reduceMotion) {
      const timer = setTimeout(() => setHiddenTrigger(trigger), STILL_DURATION_MS);
      return () => clearTimeout(timer);
    }
    opacity.set(withSequence(withTiming(1, { duration: 80 }), withDelay(450, withTiming(0, { duration: 250 }))));
    scale.set(withSequence(withTiming(0.6, { duration: 0 }), withSpring(1, { damping: 12 })));
  }, [trigger, reduceMotion, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  const mark = (
    <View style={styles.badge}>
      <Text style={styles.mark} accessibilityLabel="Not that letter, try again">
        ✕
      </Text>
    </View>
  );

  if (reduceMotion) {
    return stillVisible ? (
      <View pointerEvents="none" style={styles.overlay}>
        {mark}
      </View>
    ) : null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, animatedStyle]}>
      {mark}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  // A coral disc with an ink outline and an ink X: the shape carries the meaning, not the color.
  badge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    borderColor: Palette.outline,
    backgroundColor: Palette.danger,
    boxShadow: `0 8px 0 ${Brand.ink}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontSize: 110,
    lineHeight: 130,
    fontWeight: 800,
    color: Palette.onAccent,
  },
});
