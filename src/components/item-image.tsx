import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { ItemImage as ItemImageData } from '@/data/board-items';
import { symbolSource } from '@/data/symbols';
import { resolvePhotoUri } from '@/lib/images';
import { useAppState } from '@/state/app-state';

/** Renders a board item's picture, whether it's a bundled pictogram or an uploaded photo. */
export function ItemImage({ image, size }: { image: ItemImageData; size: number }) {
  const { photosVersion } = useAppState();

  if (image.kind === 'symbol') {
    const source = symbolSource(image.key);
    // An unknown key (from a newer app version, say) leaves an empty space rather than crashing.
    return source ? (
      <Image source={source} style={{ width: size, height: size }} contentFit="contain" />
    ) : (
      <View style={{ width: size, height: size }} />
    );
  }
  return (
    <Image
      // A photo synced from another device may arrive after the tile first renders; the
      // changing key makes the image try again once its file has downloaded.
      key={photosVersion}
      source={{ uri: resolvePhotoUri(image.file) }}
      style={[styles.photo, { width: size, height: size }]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  photo: { borderRadius: 12 },
});
