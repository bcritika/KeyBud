import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

/**
 * A big red X that flashes over the screen each time `trigger` increases. It is deliberately
 * silent and haptic-free: a wrong answer gets a quiet visual "no", never a punishing one.
 */
export function WrongMark({ trigger }: { trigger: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (trigger === 0) return;
    opacity.set(withSequence(withTiming(1, { duration: 80 }), withDelay(450, withTiming(0, { duration: 250 }))));
    scale.set(withSequence(withTiming(0.6, { duration: 0 }), withSpring(1, { damping: 12 })));
  }, [trigger, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, animatedStyle]}>
      <Text style={styles.mark} accessibilityLabel="Not that letter, try again">
        ✕
      </Text>
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
  mark: {
    fontSize: 160,
    lineHeight: 180,
    fontWeight: 800,
    color: Palette.danger,
  },
});
