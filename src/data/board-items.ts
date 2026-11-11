import type { SymbolKey } from '@/data/symbols';

/** A picture on a board item: a bundled pictogram, or a photo the user uploaded. */
export type ItemImage =
  /** `key` names a pictogram in data/symbols.ts. Items saved before pictograms may hold an emoji. */
  | { kind: 'symbol'; key: string }
  /** `file` is a file name inside the app's board-images folder (see lib/images.ts). */
  | { kind: 'photo'; file: string };

export type BoardItem = {
  id: string;
  /** Lowercase letters only, so it can be spelled on the keyboard. */
  word: string;
  image: ItemImage;
  isCustom?: boolean;
};

const symbolItem = (word: string, key: SymbolKey): BoardItem => ({
  id: `default-${word}`,
  word,
  image: { kind: 'symbol', key },
});

export const DEFAULT_ITEMS: BoardItem[] = [
  symbolItem('help', 'help'),
  symbolItem('water', 'water'),
  symbolItem('eat', 'eat'),
  symbolItem('drink', 'drink'),
  symbolItem('more', 'more'),
  symbolItem('stop', 'stop'),
  symbolItem('play', 'play'),
  symbolItem('home', 'home'),
  symbolItem('apple', 'apple'),
  symbolItem('milk', 'milk'),
  symbolItem('bread', 'bread'),
  symbolItem('cat', 'cat'),
  symbolItem('dog', 'dog'),
  symbolItem('ball', 'ball'),
  symbolItem('book', 'book'),
  symbolItem('bed', 'bed'),
  symbolItem('car', 'car'),
  symbolItem('sun', 'sun'),
  symbolItem('hat', 'hat'),
  symbolItem('cup', 'cup'),
];

export const DEFAULT_SELECTED_IDS = DEFAULT_ITEMS.slice(0, 8).map((item) => item.id);
