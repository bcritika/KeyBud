import { StyleSheet, Text, View, useWindowDimensions, type HostInstance } from 'react-native';

import { FunFont, KEY_OUTLINE, KEY_RADIUS, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SLOT_GAP = Spacing.two;
const MAX_SLOT_SIZE = 80;

type LetterSlotsProps = {
  word: string;
  /** One entry per letter: the letter placed there, or null while still empty. */
  filled: (string | null)[];
  /** Show a copy of each missing letter as a scaffold for early levels. */
  showGhost: boolean;
  /** Lets the screen measure each square so it can tell which one a drop landed on. */
  registerSlot: (index: number, node: HostInstance | null) => void;
};

/**
 * The squares the word is spelled into. An empty square is white with a dashed outline; a
 * filled one turns mint with a solid outline and shows its letter, so "done" is never color alone.
 */
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
                ? { backgroundColor: Palette.successFill, borderStyle: 'solid' }
                : { backgroundColor: theme.backgroundElement },
            ]}>
            {placed ? (
              <Text style={[styles.letter, { color: Palette.onAccent }]}>{placed.toUpperCase()}</Text>
            ) : showGhost ? (
              <Text style={[styles.letter, { color: theme.textSecondary }]}>{expected.toUpperCase()}</Text>
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
    borderRadius: KEY_RADIUS,
    borderWidth: KEY_OUTLINE,
    borderColor: Palette.outline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 36,
    lineHeight: 48,
    fontFamily: FunFont.extraBold,
  },
});
