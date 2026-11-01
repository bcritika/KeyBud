import { useEffect, useRef } from 'react';

/**
 * A ref that always holds the most recent value. Gesture callbacks are captured when a drag
 * begins, so they read from this instead of closing over state that may have moved on.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
