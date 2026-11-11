import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

/**
 * The KeyBud palette. Every text/background pair the app uses is checked for at least 4.5:1
 * contrast by scripts/check-contrast.js; keep that file in sync when changing anything here.
 */
export const Brand = {
  ink: '#17133A',
  violet: '#3A1FA8',
  sun: '#FFD21F',
  coral: '#FF6B4A',
  mint: '#12D6B0',
  sky: '#39B7FF',
  pink: '#FF7BC8',
  lime: '#B8F03C',
  paper: '#FFF9EC',
} as const;

/**
 * Screen colors. The chunky ink-outlined look is designed for a light paper background, so
 * the app has a single light theme (app.json pins userInterfaceStyle to light).
 */
export const Colors = {
  light: {
    text: Brand.ink,
    background: Brand.paper,
    /** Cards, inputs and secondary buttons: white panels with an ink outline on the paper. */
    backgroundElement: '#FFFFFF',
    backgroundSelected: Brand.sun,
    /** A softened ink for supporting copy. Still 4.5:1 or better on paper and on white. */
    textSecondary: '#4D4870',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

/** Role names for the brand colors, plus the text color that reads on each. */
export const Palette = {
  primary: Brand.violet,
  /** A translucent wash of primary, e.g. behind the selected tab. */
  primarySoft: 'rgba(58, 31, 168, 0.14)',
  success: Brand.mint,
  /** The correct-letter square fill; paired with onAccent text. */
  successFill: Brand.mint,
  danger: Brand.coral,
  highlight: Brand.sun,
  /** Text and icons on every bright fill (sun, coral, mint, sky, pink, lime). */
  onAccent: Brand.ink,
  /** Text and icons on violet. */
  onPrimary: Brand.paper,
  outline: Brand.ink,
} as const;

/**
 * Fills for things a learner picks out or drags: board tiles, keyboard keys, progress dots.
 * All of them take Palette.onAccent (ink) text. Violet is left out because it needs light text.
 */
export const KidColors = [Brand.sun, Brand.coral, Brand.mint, Brand.sky, Brand.pink, Brand.lime] as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    mono: 'monospace',
  },
  web: {
    mono: 'var(--font-mono)',
  },
});

/**
 * Baloo 2 for keys, letters and headlines; Nunito for everything else. Both are loaded in
 * app/_layout.tsx. Each name is one specific weight, so styles using them set fontWeight to
 * 'normal' rather than a number, which would make some platforms fake a weight or drop the font.
 */
export const FunFont = {
  semiBold: 'Baloo2_600SemiBold',
  extraBold: 'Baloo2_800ExtraBold',
} as const;

export const BodyFont = {
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

/** The chunky key look: a thick ink outline, round corners and a hard shadow underneath. */
export const KEY_OUTLINE = 4;
export const KEY_RADIUS = 24;
export const KEY_DEPTH = 6;
export const KEY_LIFT_SHADOW = 16;

export const Chunky = {
  key: {
    borderWidth: KEY_OUTLINE,
    borderColor: Brand.ink,
    borderRadius: KEY_RADIUS,
    boxShadow: `0 ${KEY_DEPTH}px 0 ${Brand.ink}`,
  },
  /** Pressed: the key sinks onto its shadow. */
  pressed: {
    transform: [{ translateY: KEY_DEPTH }],
    boxShadow: 'none',
  },
  /** Picked up and being dragged. */
  lifted: {
    transform: [{ rotate: '-4deg' }, { scale: 1.05 }],
    boxShadow: `0 ${KEY_LIFT_SHADOW}px 0 ${Brand.ink}`,
  },
  /** The spot a dragged key left behind. */
  leftBehind: { opacity: 0.45 },
} satisfies Record<string, ViewStyle>;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** The smallest a tappable control may be, in each direction. See hooks/use-touch-target.ts. */
export const TouchTarget = { tablet: 88, phone: 44 } as const;
/** Screens at least this wide on their short side count as tablets. */
export const TabletMinWidth = 600;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
