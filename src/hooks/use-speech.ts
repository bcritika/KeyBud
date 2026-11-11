import * as Speech from 'expo-speech';
import { useCallback } from 'react';

import { usePreferences } from '@/state/preferences';

/**
 * Returns a function that says something out loud in the chosen voice and speed, cutting off
 * anything still being said so taps never queue up behind each other.
 */
export function useSpeak() {
  const { voiceId, speechRate } = usePreferences();

  return useCallback(
    (text: string) => {
      Speech.stop();
      Speech.speak(text, { voice: voiceId ?? undefined, rate: speechRate });
    },
    [voiceId, speechRate],
  );
}
