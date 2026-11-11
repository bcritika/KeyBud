import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ItemImage } from '@/components/item-image';
import { ThemedText } from '@/components/themed-text';
import { BodyFont, Chunky, Palette, Spacing } from '@/constants/theme';
import type { BoardItem } from '@/data/board-items';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';

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
  const touchTarget = useTouchTarget();
  const isSelectable = selected !== undefined;
  // The delete button is drawn smaller than a touch target, and hitSlop makes up the rest.
  const deleteSize = Math.round(touchTarget * 0.7);
  const deleteSlop = Math.ceil((touchTarget - deleteSize) / 2);

  return (
    <View style={{ width: size }}>
      <Pressable
        accessibilityRole={isSelectable ? 'checkbox' : 'button'}
        accessibilityState={isSelectable ? { checked: selected } : undefined}
        accessibilityLabel={item.word}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          Chunky.key,
          // Selected tiles turn sun-yellow AND get a check badge, so selection isn't color alone.
          { height: size, backgroundColor: selected ? Palette.highlight : theme.backgroundElement },
          pressed && Chunky.pressed,
        ]}>
        {/* Like a printed board: the picture large on a plain card, with its word underneath. */}
        <ItemImage image={item.image} size={Math.round(size * 0.62)} />
        <ThemedText type="smallBold" style={styles.word} numberOfLines={1}>
          {item.word}
        </ThemedText>
        {selected ? (
          <View style={styles.check}>
            <Text style={styles.badgeMark}>✓</Text>
          </View>
        ) : null}
      </Pressable>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.word}`}
          onPress={onDelete}
          hitSlop={deleteSlop}
          style={[
            styles.delete,
            { width: deleteSize, height: deleteSize, borderRadius: deleteSize / 2 },
          ]}>
          <Text style={styles.badgeMark}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const badge = {
  borderWidth: 3,
  borderColor: Palette.outline,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
  },
  word: { fontSize: 16, lineHeight: 22, textTransform: 'capitalize' },
  check: {
    ...badge,
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.success,
  },
  badgeMark: { color: Palette.onAccent, fontSize: 15, lineHeight: 20, fontFamily: BodyFont.extraBold },
  delete: {
    ...badge,
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: Palette.danger,
  },
});
