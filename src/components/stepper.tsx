import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chunky, FunFont, KEY_DEPTH, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  /** How much each press changes the value. Defaults to 1. */
  step?: number;
  /** How the value is shown, e.g. as a speed. Defaults to the plain number. */
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
};

/** A labeled −/+ control for a small bounded number, such as a count in Settings. */
export function Stepper({ label, value, min, max, step = 1, formatValue = String, onChange }: StepperProps) {
  // Rounded so repeated fractional steps (0.25 + 0.25 + ...) never drift off the grid.
  const change = (delta: number) => onChange(Math.round((value + delta) * 100) / 100);

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.control}>
        <StepButton symbol="−" label={`Decrease ${label}`} onPress={() => change(-step)} disabled={value <= min} />
        <View style={styles.valueBubble} accessibilityLiveRegion="polite">
          <Text style={styles.value}>{formatValue(value)}</Text>
        </View>
        <StepButton symbol="+" label={`Increase ${label}`} onPress={() => change(step)} disabled={value >= max} />
      </View>
    </View>
  );
}

function StepButton({
  symbol,
  label,
  onPress,
  disabled,
}: {
  symbol: string;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  const touchTarget = useTouchTarget();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepButton,
        Chunky.key,
        { width: touchTarget, height: touchTarget, backgroundColor: theme.backgroundElement },
        disabled && styles.disabled,
        pressed && !disabled && Chunky.pressed,
      ]}>
      <Text style={[styles.symbol, { color: theme.text }]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.three },
  label: { flex: 1, minWidth: 140 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: KEY_DEPTH,
  },
  stepButton: { alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 24, lineHeight: 30, fontFamily: FunFont.extraBold },
  valueBubble: {
    minWidth: 56,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: Palette.outline,
    paddingHorizontal: Spacing.two,
    backgroundColor: Palette.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 20, lineHeight: 26, fontFamily: FunFont.extraBold, color: Palette.onAccent },
  disabled: { opacity: 0.35, boxShadow: 'none' },
});
