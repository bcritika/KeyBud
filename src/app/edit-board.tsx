import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoardTile } from '@/components/board-tile';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DEFAULT_ITEMS, type BoardItem } from '@/data/board-items';
import { useBoardGrid } from '@/hooks/use-board-grid';
import { useAppState } from '@/state/app-state';

export default function EditBoardScreen() {
  const router = useRouter();
  const { tileSize, gap } = useBoardGrid();
  const { customItems, isOnBoard, toggleItem, removeCustomItem, boardItems } = useAppState();

  const confirmDelete = (item: BoardItem) => {
    Alert.alert(`Delete "${item.word}"?`, 'This removes your picture from the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeCustomItem(item.id) },
    ]);
  };

  const renderGrid = (items: BoardItem[], deletable: boolean) => (
    <View style={[styles.grid, { gap }]}>
      {items.map((item) => (
        <BoardTile
          key={item.id}
          item={item}
          size={tileSize}
          selected={isOnBoard(item.id)}
          onPress={() => toggleItem(item.id)}
          onDelete={deletable ? () => confirmDelete(item) : undefined}
        />
      ))}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText themeColor="textSecondary">
            Tap a picture to put it on your board or take it off. {boardItems.length} on your board now.
          </ThemedText>

          <Button label="Add my own picture" onPress={() => router.push('/add-item')} />

          {customItems.length ? (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary">
                MY PICTURES
              </ThemedText>
              {renderGrid(customItems, true)}
            </>
          ) : null}

          <ThemedText type="smallBold" themeColor="textSecondary">
            READY-MADE PICTURES
          </ThemedText>
          {renderGrid(DEFAULT_ITEMS, false)}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
