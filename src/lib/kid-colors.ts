import { KidColors } from '@/constants/theme';

/**
 * Picks a color from KidColors for a given key (a board item's id, a letter, ...). The same key
 * always gets the same color, so a tile or key doesn't change color as other items are added,
 * removed, or reordered around it.
 */
export function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return KidColors[Math.abs(hash) % KidColors.length];
}
