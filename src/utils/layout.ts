import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { spacing } from '../theme/colors';

export const TAB_BAR_BASE = 64;
export const STICKY_ACTION_HEIGHT = 72;

/** Tab bar height including home-indicator padding. Keep in sync with tabBarDockStyle. */
export function tabBarClearance(insetsBottom: number) {
  return TAB_BAR_BASE + Math.max(insetsBottom, spacing.stackSm);
}

/** Docked tab bar: in layout flow so screens sit above it, not under it. */
export function tabBarDockStyle(insetsBottom: number) {
  return {
    height: tabBarClearance(insetsBottom),
    paddingTop: spacing.stackSm,
    paddingBottom: Math.max(insetsBottom, spacing.stackSm),
  };
}

/**
 * Extra scroll padding inside tab screens.
 * The tab bar occupies layout space, so this is breathing room plus sticky overlays.
 */
export function screenBottomPadding(_insets: Pick<EdgeInsets, 'bottom'>, extraSticky = 0) {
  return extraSticky + spacing.stackMd;
}

/** Bottom padding for full-screen sheets/modals that cover the tab bar. */
export function sheetBottomPadding(insets: Pick<EdgeInsets, 'bottom'>) {
  return Math.max(insets.bottom, spacing.stackSm) + spacing.stackMd;
}

export const gridCardStyle = {
  flexGrow: 1,
  flexBasis: Platform.OS === 'web' ? ('calc(50% - 6px)' as unknown as number) : '47%',
} as const;
