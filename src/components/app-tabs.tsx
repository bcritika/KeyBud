import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { BodyFont, Colors, Palette } from '@/constants/theme';

export default function AppTabs() {
  const colors = Colors.light;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={Palette.highlight}
      iconColor={{ default: colors.textSecondary, selected: Palette.primary }}
      labelStyle={{
        default: { color: colors.textSecondary, fontFamily: BodyFont.bold },
        selected: { color: Palette.primary, fontFamily: BodyFont.extraBold },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="graduationcap.fill" md="school" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="board">
        <NativeTabs.Trigger.Label>Board</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
