export const KEYBOARD_ROWS: string[][] = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row) =>
  row.split(''),
);
const ALPHABET = KEYBOARD_ROWS.flat();

export const MAX_LEVEL = 6;

/** How many clean (no-mistake) words in a row it takes to level up, and its adjustable range. */
export const DEFAULT_REQUIRED_STREAK = 3;
export const MIN_REQUIRED_STREAK = 1;
export const MAX_REQUIRED_STREAK = 10;

/** Distractor letters lit up on top of the letters the word needs, indexed by level - 1. */
const EXTRA_LETTERS_BY_LEVEL = [0, 3, 6, 10, 15, ALPHABET.length];

/** Levels 1-2 show a faint copy of the word inside the empty squares as a scaffold. */
export const showsGhostLetters = (level: number) => level <= 2;

export type Progress = {
  level: number;
  /** Clean words spelled in a row since the last mistake or level up. Any mistake resets this to 0. */
  streak: number;
  totalWords: number;
};

export const INITIAL_PROGRESS: Progress = { level: 1, streak: 0, totalWords: 0 };

/**
 * Which keys are highlighted (and draggable) for a word at a level. Level 1 lights only the
 * letters the word needs; each level after adds more random letters until the whole keyboard is on.
 */
export function highlightedLetters(word: string, level: number, random = Math.random): Set<string> {
  const lit = new Set(word.split(''));
  const extras = EXTRA_LETTERS_BY_LEVEL[Math.min(level, MAX_LEVEL) - 1];
  const pool = ALPHABET.filter((letter) => !lit.has(letter));

  // Fisher-Yates shuffle, then take as many extras as this level asks for.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  pool.slice(0, extras).forEach((letter) => lit.add(letter));
  return lit;
}

/** Zeroes the streak, or returns the same object untouched if it's already 0. */
export function resetStreak(progress: Progress): Progress {
  return progress.streak === 0 ? progress : { ...progress, streak: 0 };
}

/**
 * Records one finished word. Only a *clean* word (no mistakes; see resetStreak, which is called
 * the moment a mistake happens) advances the streak, and only reaching `requiredStreak` clean
 * words in a row levels up.
 */
export function advanceProgress(
  progress: Progress,
  requiredStreak: number,
  wasClean: boolean,
): { progress: Progress; leveledUp: boolean } {
  const totalWords = progress.totalWords + 1;

  if (progress.level >= MAX_LEVEL || !wasClean) {
    return { progress: { ...progress, totalWords }, leveledUp: false };
  }
  const streak = progress.streak + 1;
  if (streak >= requiredStreak) {
    return { progress: { level: progress.level + 1, streak: 0, totalWords }, leveledUp: true };
  }
  return { progress: { ...progress, streak, totalWords }, leveledUp: false };
}

/** A short, plain-language description of what a level asks of the learner. */
export function describeLevel(level: number, requiredStreak: number): string {
  if (level >= MAX_LEVEL) return 'The whole keyboard is ready. Find every letter yourself.';
  const extra = EXTRA_LETTERS_BY_LEVEL[level - 1];
  const lettersPart =
    extra === 0 ? 'Only the letters you need light up.' : `${extra} extra letters light up too, so look closely.`;
  const streakPart =
    requiredStreak === 1
      ? 'Spell it correctly to reach the next level.'
      : `Spell ${requiredStreak} in a row with no mistakes to reach the next level.`;
  return `${lettersPart} ${streakPart}`;
}
