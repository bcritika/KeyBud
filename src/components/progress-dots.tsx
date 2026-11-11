import { StyleSheet, Text, View } from 'react-native';

import { BodyFont, KidColors, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * A row of dots showing how many words are done toward the next level. A done dot is filled
 * in and checked; one still to go is hollow, so the count never depends on color alone.
 */
export function ProgressDots({ filled, total }: { filled: number; total: number }) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${filled} of ${total} words done this level`}>
      {Array.from({ length: total }, (_, index) => {
        const done = index < filled;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: done ? KidColors[index % KidColors.length] : theme.backgroundElement },
            ]}>
            {done ? <Text style={styles.check}>✓</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 12, lineHeight: 16, fontFamily: BodyFont.extraBold, color: Palette.onAccent },
});
