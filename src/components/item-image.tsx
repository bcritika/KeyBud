import { Image } from 'expo-image';
import { StyleSheet, Text } from 'react-native';

import type { ItemImage as ItemImageData } from '@/data/board-items';
import { resolvePhotoUri } from '@/lib/images';
import { useAppState } from '@/state/app-state';

/** Renders a board item's picture, whether it's a built-in emoji or an uploaded photo. */
export function ItemImage({ image, size }: { image: ItemImageData; size: number }) {
  const { photosVersion } = useAppState();

  if (image.kind === 'emoji') {
    return (
      <Text style={{ fontSize: size * 0.8, lineHeight: size, height: size, textAlign: 'center' }}>
        {image.value}
      </Text>
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
