import { StyleSheet, Text, type TextProps } from 'react-native';

import { BodyFont, Fonts, FunFont, Palette, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Every font here is a single-weight file, so fontWeight stays 'normal' (see FunFont).
const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BodyFont.bold,
    fontWeight: 'normal',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BodyFont.extraBold,
    fontWeight: 'normal',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: BodyFont.bold,
    fontWeight: 'normal',
  },
  title: {
    fontSize: 48,
    lineHeight: 60,
    fontFamily: FunFont.extraBold,
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: FunFont.extraBold,
    fontWeight: 'normal',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: BodyFont.extraBold,
    fontWeight: 'normal',
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: BodyFont.extraBold,
    fontWeight: 'normal',
    color: Palette.primary,
    textDecorationLine: 'underline',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
