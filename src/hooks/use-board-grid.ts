import { useWindowDimensions } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTouchTarget } from '@/hooks/use-touch-target';
import { MAX_GRID_COLUMNS, MIN_GRID_COLUMNS, usePreferences } from '@/state/preferences';

/** Smallest a picture tile may get: big enough to read and tap even on a tablet. */
const MIN_TILE_SIZE = 96;

/**
 * Lays out the picture grid from the chosen column count. On a narrow screen fewer columns may
 * fit than were chosen, so `maxColumns` is the most this screen can show with every tile still
 * at least MIN_TILE_SIZE (and a full touch target) wide.
 */
export function useBoardGrid() {
  const { width } = useWindowDimensions();
  const touchTarget = useTouchTarget();
  const { gridColumns } = usePreferences();

  const gap = Spacing.three;
  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const minTile = Math.max(MIN_TILE_SIZE, touchTarget);
  const maxColumns = Math.max(
    MIN_GRID_COLUMNS,
    Math.min(MAX_GRID_COLUMNS, Math.floor((contentWidth + gap) / (minTile + gap))),
  );
  const columns = Math.min(gridColumns, maxColumns);

  return {
    columns,
    maxColumns,
    gap,
    tileSize: Math.floor((contentWidth - gap * (columns - 1)) / columns),
  };
}
