import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chunky, FunFont, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A chunky key-style button: violet for the main action, white for secondary, coral for danger. */
export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const theme = useTheme();
  const touchTarget = useTouchTarget();
  const { background, text } = {
    primary: { background: Palette.primary, text: Palette.onPrimary },
    secondary: { background: theme.backgroundElement, text: theme.text },
    danger: { background: Palette.danger, text: Palette.onAccent },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        Chunky.key,
        { backgroundColor: background, minHeight: Math.max(56, touchTarget) },
        pressed && Chunky.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <ThemedText style={[styles.label, { color: text }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FunFont.extraBold,
    fontWeight: 'normal',
    fontSize: 20,
    lineHeight: 28,
  },
  disabled: { opacity: 0.4, boxShadow: 'none' },
});
