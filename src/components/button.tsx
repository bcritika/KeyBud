import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FunFont, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS = {
  primary: { background: Palette.primary, edge: Palette.primaryDark },
  danger: { background: Palette.danger, edge: Palette.dangerDark },
} as const;

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const theme = useTheme();
  const { background, edge } =
    variant === 'secondary' ? { background: theme.backgroundSelected, edge: theme.backgroundSelected } : VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderBottomColor: edge, borderBottomWidth: pressed ? 2 : 5 },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <ThemedText
        type="default"
        style={[styles.label, variant !== 'secondary' && { color: Palette.onPrimary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FunFont.semiBold,
    // Cancels ThemedText's own numeric fontWeight: mixing that with a specific, single-weight
    // custom font file makes some platforms fake a different weight or silently drop the font.
    fontWeight: 'normal',
    fontSize: 18,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});
