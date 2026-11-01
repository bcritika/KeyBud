import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FunFont, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** A labeled −/+ control for a small bounded number, such as a count in Settings. */
export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={[styles.control, { backgroundColor: theme.backgroundElement }]}>
        <StepButton symbol="−" label="Decrease" onPress={() => onChange(value - 1)} disabled={value <= min} />
        <View style={styles.valueBubble} accessibilityLiveRegion="polite">
          <Text style={styles.value}>{value}</Text>
        </View>
        <StepButton symbol="+" label="Increase" onPress={() => onChange(value + 1)} disabled={value >= max} />
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.stepButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <ThemedText style={[styles.symbol, { color: Palette.primary }]}>{symbol}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  label: { flex: 1 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  stepButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 22, fontWeight: 800 },
  valueBubble: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 6,
    backgroundColor: Palette.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 18, fontFamily: FunFont.bold, color: Palette.onAccent },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
});
