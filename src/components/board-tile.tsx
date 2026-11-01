import { Pressable, StyleSheet, View } from 'react-native';

import { ItemImage } from '@/components/item-image';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import type { BoardItem } from '@/data/board-items';
import { useTheme } from '@/hooks/use-theme';
import { colorForKey } from '@/lib/kid-colors';

type BoardTileProps = {
  item: BoardItem;
  size: number;
  onPress: () => void;
  /** When set, the tile acts as a checkbox and shows whether it's on the board. */
  selected?: boolean;
  /** When set, a small delete button appears on the tile (used for the user's own items). */
  onDelete?: () => void;
};

/** One picture-and-word tile, used both on the board itself and when choosing what's on it. */
export function BoardTile({ item, size, onPress, selected, onDelete }: BoardTileProps) {
  const theme = useTheme();
  const isSelectable = selected !== undefined;
  const backdropSize = Math.round(size * 0.7);

  return (
    <View style={{ width: size }}>
      <Pressable
        accessibilityRole={isSelectable ? 'checkbox' : 'button'}
        accessibilityState={isSelectable ? { checked: selected } : undefined}
        accessibilityLabel={item.word}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          {
            height: size,
            backgroundColor: theme.backgroundElement,
            borderColor: selected ? Palette.primary : 'transparent',
          },
          pressed && styles.pressed,
        ]}>
        <View
          style={[
            styles.imageBackdrop,
            { width: backdropSize, height: backdropSize, borderRadius: backdropSize / 2 },
            { backgroundColor: colorForKey(item.id) },
          ]}>
          <ItemImage image={item.image} size={Math.round(size * 0.42)} />
        </View>
        <ThemedText type="smallBold" style={styles.word} numberOfLines={1}>
          {item.word}
        </ThemedText>
        {selected ? (
          <View style={styles.check}>
            <ThemedText style={styles.checkMark}>✓</ThemedText>
          </View>
        ) : null}
      </Pressable>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.word}`}
          onPress={onDelete}
          hitSlop={8}
          style={styles.delete}>
          <ThemedText style={styles.deleteMark}>✕</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Spacing.three,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
  },
  pressed: { opacity: 0.7 },
  imageBackdrop: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  word: { fontSize: 16, textTransform: 'capitalize' },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: Palette.onPrimary, fontSize: 14, lineHeight: 18, fontWeight: 800 },
  delete: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteMark: { color: Palette.onPrimary, fontSize: 13, lineHeight: 16, fontWeight: 800 },
});
