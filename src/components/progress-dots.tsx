import { StyleSheet, View } from 'react-native';

import { KidColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A row of dots showing how many words are done toward the next level, each a different color. */
export function ProgressDots({ filled, total }: { filled: number; total: number }) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${filled} of ${total} words done this level`}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index < filled ? KidColors[index % KidColors.length] : theme.backgroundSelected,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
