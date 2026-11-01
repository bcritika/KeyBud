/** A picture on a board item: a built-in emoji, or a photo the user uploaded. */
export type ItemImage =
  | { kind: 'emoji'; value: string }
  /** `file` is a file name inside the app's board-images folder (see lib/images.ts). */
  | { kind: 'photo'; file: string };

export type BoardItem = {
  id: string;
  /** Lowercase letters only, so it can be spelled on the keyboard. */
  word: string;
  image: ItemImage;
  isCustom?: boolean;
};

const emojiItem = (word: string, emoji: string): BoardItem => ({
  id: `default-${word}`,
  word,
  image: { kind: 'emoji', value: emoji },
});

export const DEFAULT_ITEMS: BoardItem[] = [
  emojiItem('help', '🆘'),
  emojiItem('water', '💧'),
  emojiItem('eat', '🍽️'),
  emojiItem('drink', '🥤'),
  emojiItem('more', '➕'),
  emojiItem('stop', '🛑'),
  emojiItem('play', '🎮'),
  emojiItem('home', '🏠'),
  emojiItem('apple', '🍎'),
  emojiItem('milk', '🥛'),
  emojiItem('bread', '🍞'),
  emojiItem('cat', '🐱'),
  emojiItem('dog', '🐶'),
  emojiItem('ball', '⚽'),
  emojiItem('book', '📖'),
  emojiItem('bed', '🛏️'),
  emojiItem('car', '🚗'),
  emojiItem('sun', '☀️'),
  emojiItem('hat', '🎩'),
  emojiItem('cup', '☕'),
];

/** Pictures offered when someone adds their own item but doesn't upload a photo. */
export const EMOJI_CHOICES = [
  '😀', '😢', '😴', '🤒', '🍕', '🍌', '🍪', '🚌', '🎵', '📺',
  '🧸', '🚿', '🚽', '👕', '👟', '💊', '📱', '🌳', '🐟', '❤️',
];

export const DEFAULT_SELECTED_IDS = DEFAULT_ITEMS.slice(0, 8).map((item) => item.id);
