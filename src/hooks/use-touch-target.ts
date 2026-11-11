import { useWindowDimensions } from 'react-native';

import { TabletMinWidth, TouchTarget } from '@/constants/theme';

/** The minimum size, in each direction, of anything tappable: 88 on a tablet, 44 elsewhere. */
export function useTouchTarget() {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= TabletMinWidth ? TouchTarget.tablet : TouchTarget.phone;
}
