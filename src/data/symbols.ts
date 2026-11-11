/**
 * Communication-board pictograms, bundled so the board works offline.
 *
 * Pictograms by Sergio Palao, from ARASAAC (https://arasaac.org), owned by the Government of
 * Aragón (Spain), and shared under CC BY-NC-SA 4.0: free for non-commercial use, with this
 * credit shown in the app (see Settings). To add one, find it at arasaac.org, save its 300px PNG
 * as assets/symbols/<key>.png and list it here.
 *
 * A custom item stores its key in the custom_items.emoji column (see data/remote.ts), which
 * holds at most 16 characters, so keys must stay that short.
 */
export const SYMBOLS = {
  apple: require('@/assets/symbols/apple.png'),
  ball: require('@/assets/symbols/ball.png'),
  banana: require('@/assets/symbols/banana.png'),
  bed: require('@/assets/symbols/bed.png'),
  book: require('@/assets/symbols/book.png'),
  bread: require('@/assets/symbols/bread.png'),
  bus: require('@/assets/symbols/bus.png'),
  car: require('@/assets/symbols/car.png'),
  cat: require('@/assets/symbols/cat.png'),
  cookie: require('@/assets/symbols/cookie.png'),
  cup: require('@/assets/symbols/cup.png'),
  dog: require('@/assets/symbols/dog.png'),
  drink: require('@/assets/symbols/drink.png'),
  eat: require('@/assets/symbols/eat.png'),
  fish: require('@/assets/symbols/fish.png'),
  happy: require('@/assets/symbols/happy.png'),
  hat: require('@/assets/symbols/hat.png'),
  help: require('@/assets/symbols/help.png'),
  home: require('@/assets/symbols/home.png'),
  love: require('@/assets/symbols/love.png'),
  medicine: require('@/assets/symbols/medicine.png'),
  milk: require('@/assets/symbols/milk.png'),
  more: require('@/assets/symbols/more.png'),
  music: require('@/assets/symbols/music.png'),
  phone: require('@/assets/symbols/phone.png'),
  pizza: require('@/assets/symbols/pizza.png'),
  play: require('@/assets/symbols/play.png'),
  sad: require('@/assets/symbols/sad.png'),
  shirt: require('@/assets/symbols/shirt.png'),
  shoes: require('@/assets/symbols/shoes.png'),
  shower: require('@/assets/symbols/shower.png'),
  sick: require('@/assets/symbols/sick.png'),
  stop: require('@/assets/symbols/stop.png'),
  sun: require('@/assets/symbols/sun.png'),
  teddy: require('@/assets/symbols/teddy.png'),
  tired: require('@/assets/symbols/tired.png'),
  toilet: require('@/assets/symbols/toilet.png'),
  tree: require('@/assets/symbols/tree.png'),
  tv: require('@/assets/symbols/tv.png'),
  water: require('@/assets/symbols/water.png'),
} as const;

export type SymbolKey = keyof typeof SYMBOLS;

export const SYMBOL_KEYS = Object.keys(SYMBOLS) as SymbolKey[];

/**
 * Custom items made before the app switched to pictograms saved an emoji. Each emoji that was
 * on offer maps to the pictogram for the same idea, so those items show clipart too.
 */
const LEGACY_EMOJI: Record<string, SymbolKey> = {
  '😀': 'happy',
  '😢': 'sad',
  '😴': 'tired',
  '🤒': 'sick',
  '🍕': 'pizza',
  '🍌': 'banana',
  '🍪': 'cookie',
  '🚌': 'bus',
  '🎵': 'music',
  '📺': 'tv',
  '🧸': 'teddy',
  '🚿': 'shower',
  '🚽': 'toilet',
  '👕': 'shirt',
  '👟': 'shoes',
  '💊': 'medicine',
  '📱': 'phone',
  '🌳': 'tree',
  '🐟': 'fish',
  '❤️': 'love',
};

/** The bundled image for a symbol key (or a legacy emoji), or undefined if there isn't one. */
export function symbolSource(key: string) {
  const symbol = key in SYMBOLS ? (key as SymbolKey) : LEGACY_EMOJI[key];
  return symbol ? SYMBOLS[symbol] : undefined;
}
