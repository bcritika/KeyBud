import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BodyFont, Chunky, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTouchTarget } from '@/hooks/use-touch-target';

/** Browsers load their voice list lazily, so an empty first answer gets one more try. */
const RETRY_MS = 1000;

type VoicePickerProps = {
  voiceId: string | null;
  onChange: (voiceId: string | null) => void;
};

/** A list of the English voices installed on this device, plus the device's default voice. */
export function VoicePicker({ voiceId, onChange }: VoicePickerProps) {
  const [voices, setVoices] = useState<Speech.Voice[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const load = (isRetry: boolean) =>
      Speech.getAvailableVoicesAsync()
        .then((all) => {
          if (cancelled) return;
          if (all.length === 0 && !isRetry) {
            retry = setTimeout(() => load(true), RETRY_MS);
            return;
          }
          const english = all.filter((voice) => voice.language.toLowerCase().startsWith('en'));
          const shown = english.length ? english : all;
          setVoices([...shown].sort((a, b) => a.name.localeCompare(b.name)));
        })
        .catch(() => !cancelled && setVoices([]));

    load(false);
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, []);

  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Speech voice">
      <VoiceRow label="Device default" detail="The voice this device normally uses" selected={voiceId === null} onPress={() => onChange(null)} />
      {voices === null ? (
        <ThemedText type="small" themeColor="textSecondary">
          Looking for voices...
        </ThemedText>
      ) : voices.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No other voices are installed on this device.
        </ThemedText>
      ) : (
        voices.map((voice) => (
          <VoiceRow
            key={voice.identifier}
            label={voice.name}
            detail={voice.language}
            selected={voiceId === voice.identifier}
            onPress={() => onChange(voice.identifier)}
          />
        ))
      )}
    </View>
  );
}

/** One choice. The chosen row is sun-yellow, raised and checked, so it's never shown by color alone. */
function VoiceRow({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const touchTarget = useTouchTarget();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}, ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        Chunky.key,
        { minHeight: touchTarget, backgroundColor: selected ? Palette.highlight : theme.backgroundElement },
        !selected && styles.unselected,
        pressed && Chunky.pressed,
      ]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Text style={styles.radioMark}>✓</Text> : null}
      </View>
      <View style={styles.text}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
          {detail}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  unselected: { boxShadow: 'none' },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Palette.outline,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: Palette.success },
  radioMark: { fontSize: 14, lineHeight: 18, fontFamily: BodyFont.extraBold, color: Palette.onAccent },
  text: { flex: 1 },
});
