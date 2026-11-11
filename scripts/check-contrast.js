// Verifies the text/background color pairs used in src/constants/theme.ts meet WCAG contrast
// minimums, so future palette tweaks don't accidentally make letters or labels hard to read.
// Run: node scripts/check-contrast.js
//
// The colors below are copied from src/constants/theme.ts rather than imported from it, since
// that file also imports React Native and a CSS file, which plain Node can't load. Keep this
// copy in sync whenever Brand, Colors or KidColors changes.
const Brand = {
  ink: '#17133A',
  violet: '#3A1FA8',
  sun: '#FFD21F',
  coral: '#FF6B4A',
  mint: '#12D6B0',
  sky: '#39B7FF',
  pink: '#FF7BC8',
  lime: '#B8F03C',
  paper: '#FFF9EC',
};
const white = '#FFFFFF';
const textSecondary = '#4D4870';
const KidColors = [Brand.sun, Brand.coral, Brand.mint, Brand.sky, Brand.pink, Brand.lime];

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every pair is held to 4.5:1 (WCAG AA for body text), even big letters and bold labels.
const MIN_RATIO = 4.5;
const CHECKS = [
  { text: Brand.ink, background: Brand.paper, note: 'body text on paper' },
  { text: Brand.ink, background: white, note: 'body text on cards and inputs' },
  { text: textSecondary, background: Brand.paper, note: 'secondary text on paper' },
  { text: textSecondary, background: white, note: 'secondary text, flat keys and ghost letters on white' },
  { text: Brand.violet, background: Brand.paper, note: 'violet headings and back link on paper' },
  { text: Brand.violet, background: white, note: 'violet celebration title on a card' },
  { text: Brand.paper, background: Brand.violet, note: 'primary button label' },
  { text: Brand.ink, background: Brand.sun, note: 'selected tab, tile, voice and value bubble' },
  ...KidColors.map((color) => ({
    text: Brand.ink,
    background: color,
    note: `ink on ${color} (keys, tiles, danger button, filled square, badges)`,
  })),
];

let failed = false;
for (const { text, background, note } of CHECKS) {
  const ratio = contrast(text, background);
  const pass = ratio >= MIN_RATIO;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)} >= ${MIN_RATIO}  ${note}`);
}

if (failed) {
  console.error('\nOne or more color pairs fail their contrast minimum.');
  process.exit(1);
}
console.log('\nAll color pairs pass.');
