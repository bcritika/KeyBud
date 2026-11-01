import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SLOT_GAP = Spacing.two;
const MAX_SLOT_SIZE = 72;

type LetterSlotsProps = {
  word: string;
  /** One entry per letter: the letter placed there, or null while still empty. */
  filled: (string | null)[];
  /** Show a faint copy of each missing letter as a scaffold for early levels. */
  showGhost: boolean;
  /** Lets the screen measure each square so it can tell which one a drop landed on. */
  registerSlot: (index: number, node: View | null) => void;
};

export function LetterSlots({ word, filled, showGhost, registerSlot }: LetterSlotsProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const available = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const size = Math.min(MAX_SLOT_SIZE, Math.floor((available - SLOT_GAP * (word.length - 1)) / word.length));

  return (
    <View style={styles.row} accessibilityLabel="Spell the word here">
      {word.split('').map((expected, index) => {
        const placed = filled[index];
        return (
          <View
            key={index}
            ref={(node) => registerSlot(index, node)}
            collapsable={false}
            accessible
            accessibilityLabel={placed ? `Square ${index + 1}, ${placed}` : `Square ${index + 1}, empty`}
            style={[
              styles.slot,
              { width: size, height: size + 8 },
              placed
                ? { backgroundColor: Palette.successFill, borderColor: Palette.successFill, borderStyle: 'solid' }
                : { backgroundColor: theme.backgroundElement, borderColor: theme.textSecondary },
            ]}>
            {placed ? (
              <Text style={[styles.letter, { color: Palette.onAccent }]}>{placed.toUpperCase()}</Text>
            ) : showGhost ? (
              <Text style={[styles.letter, { color: theme.textSecondary, opacity: 0.3 }]}>
                {expected.toUpperCase()}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SLOT_GAP,
  },
  slot: {
    borderRadius: 14,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 36,
    fontFamily: FunFont.bold,
  },
});
