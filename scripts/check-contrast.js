// Verifies the text/background color pairs used in src/constants/theme.ts meet WCAG contrast
// minimums, so future palette tweaks don't accidentally make letters or labels hard to read.
// Run: node scripts/check-contrast.js
//
// The colors below are copied from src/constants/theme.ts rather than imported from it, since
// that file also imports React Native and a CSS file, which plain Node can't load. Keep this
// copy in sync whenever Palette or KidColors changes.
const Palette = {
  primary: '#3E4FE0',
  success: '#128A45',
  successFill: '#51CF66',
  danger: '#E03131',
  highlight: '#FFD43B',
  onAccent: '#1B1B1F',
  onPrimary: '#FFFFFF',
};
const KidColors = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA', '#F783AC', '#3BC9DB'];

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

// { text, background, minRatio, note }. minRatio 3 = WCAG AA for large/bold text (what every
// one of these pairs is used for: big letters and bold button labels), 4.5 = AA for body text.
const CHECKS = [
  { text: Palette.onPrimary, background: Palette.primary, minRatio: 4.5, note: 'primary button label' },
  { text: Palette.onPrimary, background: Palette.danger, minRatio: 4.5, note: 'danger button label' },
  { text: Palette.onAccent, background: Palette.successFill, minRatio: 3, note: 'filled letter square' },
  { text: Palette.onAccent, background: Palette.highlight, minRatio: 3, note: 'legacy highlight key' },
  { text: Palette.success, background: '#F0F0F3', minRatio: 3, note: 'celebration text on light background' },
  { text: Palette.success, background: '#212225', minRatio: 3, note: 'celebration text on dark background' },
  ...KidColors.map((color) => ({
    text: Palette.onAccent,
    background: color,
    minRatio: 3,
    note: `kid color ${color} (keyboard key / board tile)`,
  })),
];

let failed = false;
for (const { text, background, minRatio, note } of CHECKS) {
  const ratio = contrast(text, background);
  const pass = ratio >= minRatio;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)} >= ${minRatio}  ${note}`);
}

if (failed) {
  console.error('\nOne or more color pairs fail their contrast minimum.');
  process.exit(1);
}
console.log('\nAll color pairs pass.');
