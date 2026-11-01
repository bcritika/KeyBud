/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Fixed accent colors that read well in both light and dark mode. Every color here was checked
 * against the text color it's meant to sit under (see scripts/check-contrast.js): onPrimary
 * (white) on primary/danger, onAccent (near-black) on success/highlight/the KidColors below.
 */
export const Palette = {
  primary: '#3E4FE0',
  /** The pressed-in "3D edge" under primary buttons. */
  primaryDark: '#2D39A1',
  /** A translucent wash of primary, e.g. behind the selected tab. Works over light or dark. */
  primarySoft: 'rgba(62, 79, 224, 0.16)',
  success: '#128A45',
  /** The correct-letter square fill; paired with onAccent text, not onPrimary. */
  successFill: '#51CF66',
  danger: '#E03131',
  /** The pressed-in "3D edge" under danger buttons. */
  dangerDark: '#A12323',
  highlight: '#FFD43B',
  onAccent: '#1B1B1F',
  onPrimary: '#FFFFFF',
} as const;

/**
 * A cheerful, high-contrast set of colors for things a learner picks out or drags: board tiles,
 * keyboard keys, progress dots. Always pair these with Palette.onAccent (dark) text or icons -
 * every one of them was checked to read clearly with dark text, not white.
 */
export const KidColors = [
  '#FF6B6B', // coral
  '#FFA94D', // tangerine
  '#FFD43B', // sunshine
  '#69DB7C', // grass
  '#4DABF7', // sky
  '#9775FA', // grape
  '#F783AC', // bubblegum
  '#3BC9DB', // turquoise
] as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * A friendly, rounded display font (Fredoka, loaded in app/_layout.tsx) used for the big,
 * playful moments: the app title, letters in play, and button labels. Body copy stays on the
 * system font (Fonts above), which stays more legible at small sizes.
 */
export const FunFont = {
  medium: 'Fredoka_500Medium',
  semiBold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
