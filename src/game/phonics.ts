/**
 * Approximate phonetic spellings for each letter's sound (e.g. "buh" for B, not the letter name
 * "bee"), fed to text-to-speech when a key is touched. There's no way to make a stock TTS voice
 * produce a true isolated phoneme from plain text - these are the same kind of respelling early
 * phonics materials use, close enough for a learner to recognize, not a studio recording.
 *
 * Multi-letter spellings are used even for single sounds (e.g. "fff", not "f") because most TTS
 * engines special-case a single character and read its letter name instead of sounding it out.
 */
export const PHONETIC_SOUND: Record<string, string> = {
  a: 'ah',
  b: 'buh',
  c: 'kuh',
  d: 'duh',
  e: 'eh',
  f: 'fff',
  g: 'guh',
  h: 'huh',
  i: 'ih',
  j: 'juh',
  k: 'kuh',
  l: 'lll',
  m: 'mmm',
  n: 'nnn',
  // Not 'oh' - that's exactly how the letter's own name is pronounced, so it'd sound like no
  // change happened at all. 'aw' gives the short "o as in hot" sound instead.
  o: 'aw',
  p: 'puh',
  q: 'kwuh',
  r: 'rrr',
  s: 'sss',
  t: 'tuh',
  u: 'uh',
  v: 'vvv',
  w: 'wuh',
  x: 'ks',
  y: 'yuh',
  z: 'zzz',
};
