import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import type { Ref } from 'react';
import { Pressable, View, StyleSheet, type HostInstance } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Chunky, FunFont, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useTouchTarget } from '@/hooks/use-touch-target';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Learn</TabButton>
          </TabTrigger>
          <TabTrigger name="board" href="/board" asChild>
            <TabButton>Board</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

/** The current tab is a raised sun-yellow key with a heavier label; the others are flat text. */
export function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  const touchTarget = useTouchTarget();
  return (
    <Pressable
      {...props}
      // expo-router still types this ref as the pre-0.88 View instance; at runtime it's the
      // same host element Pressable expects.
      ref={ref as Ref<HostInstance>}
      style={({ pressed }) => [
        styles.tabButton,
        { minHeight: touchTarget },
        isFocused && [Chunky.key, styles.tabButtonFocused],
        pressed && isFocused && Chunky.pressed,
      ]}>
      <ThemedText
        type="small"
        themeColor={isFocused ? 'text' : 'textSecondary'}
        style={isFocused && styles.tabLabelFocused}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={[styles.innerContainer, Chunky.key]}>
        <ThemedText style={styles.brandText}>KeyBud</ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
    fontFamily: FunFont.extraBold,
    fontSize: 22,
    lineHeight: 30,
  },
  tabButton: {
    paddingHorizontal: Spacing.three,
    borderRadius: Chunky.key.borderRadius,
    borderWidth: Chunky.key.borderWidth,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  tabButtonFocused: {
    backgroundColor: Palette.highlight,
  },
  tabLabelFocused: {
    fontFamily: FunFont.extraBold,
    fontSize: 16,
  },
});
