import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BodyFont, KEY_OUTLINE, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  const touchTarget = useTouchTarget();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            minHeight: Math.max(56, touchTarget),
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: Palette.outline,
          },
          // An error gets a thicker coral outline and a written message, not just a color change.
          error && styles.inputError,
          style,
        ]}
        {...inputProps}
      />
      {error ? <FieldMessage kind="error">{error}</FieldMessage> : null}
    </View>
  );
}

/**
 * An error or success message. Coral and mint text would be too faint on paper, so the text
 * stays ink and the color goes on a symbol badge in front of it (⚠ or ✓).
 */
export function FieldMessage({ kind, children }: { kind: 'error' | 'success'; children: string }) {
  const isError = kind === 'error';
  return (
    <View style={styles.message} accessibilityLiveRegion="polite">
      <View style={[styles.badge, { backgroundColor: isError ? Palette.danger : Palette.success }]}>
        <ThemedText style={styles.badgeSymbol}>{isError ? '!' : '✓'}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.messageText}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  input: {
    borderRadius: Spacing.three,
    borderWidth: KEY_OUTLINE,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
    fontFamily: BodyFont.bold,
  },
  inputError: { borderColor: Palette.danger, borderWidth: KEY_OUTLINE + 2 },
  message: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSymbol: { fontSize: 13, lineHeight: 18, fontFamily: BodyFont.extraBold, color: Palette.onAccent },
  messageText: { flex: 1 },
});
