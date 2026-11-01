import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect } from 'react';

/** Returns a function that plays the "correct letter" chime and a success haptic together. */
export function useSuccessFeedback() {
  const player = useAudioPlayer(require('@/assets/sounds/success.wav'));

  useEffect(() => {
    // Learners shouldn't lose the reward sound just because the ringer switch is off.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  return useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // seekTo is async; calling play() before it resolves can race with the player still sitting
    // at the end of the previous playback, which plays nothing. Only start once the seek lands.
    player
      .seekTo(0)
      .catch(() => {})
      .finally(() => player.play());
  }, [player]);
}
