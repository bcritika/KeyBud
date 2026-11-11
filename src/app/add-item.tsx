import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ItemImage } from '@/components/item-image';
import { FieldMessage, TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BodyFont, Chunky, KEY_OUTLINE, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { SYMBOL_KEYS, type SymbolKey } from '@/data/symbols';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';
import { savePhoto } from '@/lib/images';
import { isValidWord, normalizeWord } from '@/lib/validation';
import { useAppState } from '@/state/app-state';

/** What the user has picked so far. A photo stays in the picker's temporary cache until saved. */
type Choice = { kind: 'symbol'; key: SymbolKey } | { kind: 'photo'; uri: string };

export default function AddItemScreen() {
  const router = useRouter();
  const { allItems, addCustomItem } = useAppState();
  const theme = useTheme();
  const symbolSize = Math.max(76, useTouchTarget());
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

  // Picking a picture fills in its word too, if the field is still empty and that word is free.
  const pickSymbol = (key: SymbolKey) => {
    setChoice({ kind: 'symbol', key });
    setImageError(undefined);
    if (!word.trim() && !allItems.some((item) => item.word === key)) setWord(key);
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
            <ThemedView type="backgroundElement" style={styles.preview}>
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
          {imageError ? <FieldMessage kind="error">{imageError}</FieldMessage> : null}

          <ThemedText themeColor="textSecondary">Or pick a ready-made picture:</ThemedText>
          <View style={styles.symbolGrid}>
            {SYMBOL_KEYS.map((key) => {
              const selected = choice?.kind === 'symbol' && choice.key === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`Use picture: ${key}`}
                  accessibilityState={{ selected }}
                  onPress={() => pickSymbol(key)}
                  style={({ pressed }) => [
                    styles.symbolButton,
                    Chunky.key,
                    {
                      width: symbolSize,
                      height: symbolSize + 20,
                      backgroundColor: selected ? Palette.highlight : theme.backgroundElement,
                    },
                    // The chosen picture sinks in and gets a check badge, not just a new color.
                    (pressed || selected) && Chunky.pressed,
                  ]}>
                  <ItemImage image={{ kind: 'symbol', key }} size={symbolSize - 24} />
                  <ThemedText type="small" numberOfLines={1}>
                    {key}
                  </ThemedText>
                  {selected ? (
                    <View style={styles.symbolCheck}>
                      <Text style={styles.symbolCheckMark}>✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Pictures: ARASAAC (arasaac.org), CC BY-NC-SA.
          </ThemedText>

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
    borderWidth: KEY_OUTLINE,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: 96, height: 96, borderRadius: 12 },
  flex: { flex: 1 },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  symbolButton: {
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolCheck: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: Palette.outline,
    backgroundColor: Palette.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolCheckMark: { fontSize: 13, lineHeight: 17, fontFamily: BodyFont.extraBold, color: Palette.onAccent },
});
