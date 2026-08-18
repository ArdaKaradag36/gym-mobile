export const colors = {
  background: '#121212',
  surface: '#131313',
  surfaceDim: '#131313',
  surfaceBright: '#3A3939',
  surfaceContainerLowest: '#0E0E0E',
  surfaceContainerLow: '#1C1B1B',
  surfaceContainer: '#201F1F',
  surfaceContainerHigh: '#2A2A2A',
  surfaceContainerHighest: '#353534',
  surfaceCard: '#1A1A1A',
  onSurface: '#E5E2E1',
  onSurfaceVariant: '#C4C9AC',
  outline: '#8E9379',
  outlineVariant: '#444933',
  neonGreen: '#C3F400',
  neonGreenDim: '#ABD600',
  neonGreenMuted: 'rgba(195, 244, 0, 0.1)',
  neonGreenBorder: 'rgba(195, 244, 0, 0.3)',
  neonGreenGlow: 'rgba(195, 244, 0, 0.2)',
  electricBlue: '#4B8EFF',
  electricBlueSoft: '#ADC6FF',
  electricBlueMuted: 'rgba(75, 142, 255, 0.15)',
  error: '#FFB4AB',
  onPrimary: '#161E00',
  tabInactive: '#8E9379',
} as const;

export type ThemeColors = typeof colors;

export const spacing = {
  unit: 4,
  stackSm: 8,
  stackMd: 16,
  stackLg: 24,
  marginPage: 20,
  gutterCard: 12,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
