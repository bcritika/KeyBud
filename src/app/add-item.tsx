import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ItemImage } from '@/components/item-image';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { EMOJI_CHOICES } from '@/data/board-items';
import { savePhoto } from '@/lib/images';
import { colorForKey } from '@/lib/kid-colors';
import { isValidWord, normalizeWord } from '@/lib/validation';
import { useAppState } from '@/state/app-state';

/** What the user has picked so far. A photo stays in the picker's temporary cache until saved. */
type Choice = { kind: 'emoji'; value: string } | { kind: 'photo'; uri: string };

export default function AddItemScreen() {
  const router = useRouter();
  const { allItems, addCustomItem } = useAppState();
  const [word, setWord] = useState('');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [wordError, setWordError] = useState<string>();
  const [imageError, setImageError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!picked.canceled) {
      setChoice({ kind: 'photo', uri: picked.assets[0].uri });
      setImageError(undefined);
    }
  };

  const handleSave = async () => {
    const normalized = normalizeWord(word);
    const nextWordError = !isValidWord(word)
      ? 'Use 2 to 12 letters, with no spaces or numbers.'
      : allItems.some((item) => item.word === normalized)
        ? 'That word is already available to choose.'
        : undefined;
    const nextImageError = choice ? undefined : 'Upload a photo or pick a picture.';
    setWordError(nextWordError);
    setImageError(nextImageError);
    if (nextWordError || !choice) return;

    setSaving(true);
    try {
      const image =
        choice.kind === 'photo'
          ? { kind: 'photo' as const, file: await savePhoto(choice.uri) }
          : choice;
      addCustomItem({ word: normalized, image });
      router.back();
    } catch {
      Alert.alert('Could not save', 'Something went wrong saving that picture. Please try again.');
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <TextField
            label="Word to spell"
            value={word}
            onChangeText={setWord}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={12}
            placeholder="for example: grandma"
            error={wordError}
          />

          <ThemedText type="smallBold">Picture</ThemedText>
          <View style={styles.previewRow}>
            <ThemedView
              type="backgroundElement"
              style={[styles.preview, choice?.kind === 'emoji' && { backgroundColor: colorForKey(choice.value) }]}>
              {choice?.kind === 'photo' ? (
                // Not saved yet, so preview straight from the picker's temporary file.
                <Image source={{ uri: choice.uri }} style={styles.photoPreview} contentFit="cover" />
              ) : choice ? (
                <ItemImage image={choice} size={96} />
              ) : (
                <ThemedText themeColor="textSecondary">None yet</ThemedText>
              )}
            </ThemedView>
            <Button label="Upload a photo" variant="secondary" onPress={pickPhoto} style={styles.flex} />
          </View>
          {imageError ? (
            <ThemedText type="small" style={{ color: Palette.danger }}>
              {imageError}
            </ThemedText>
          ) : null}

          <ThemedText themeColor="textSecondary">Or pick a ready-made picture:</ThemedText>
          <View style={styles.emojiGrid}>
            {EMOJI_CHOICES.map((emoji) => {
              const selected = choice?.kind === 'emoji' && choice.value === emoji;
              return (
                <Pressable
                  key={emoji}
                  accessibilityRole="button"
                  accessibilityLabel={`Use picture ${emoji}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setChoice({ kind: 'emoji', value: emoji });
                    setImageError(undefined);
                  }}
                  style={[
                    styles.emojiButton,
                    { backgroundColor: colorForKey(emoji) },
                    selected && styles.emojiSelected,
                  ]}>
                  <ThemedText style={styles.emoji}>{emoji}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Button label={saving ? 'Saving...' : 'Add to my board'} onPress={handleSave} disabled={saving} />
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  preview: {
    width: 120,
    height: 120,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: 96, height: 96, borderRadius: 12 },
  flex: { flex: 1 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: Spacing.three,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSelected: { borderColor: Palette.primary },
  emoji: { fontSize: 30, lineHeight: 38 },
});
