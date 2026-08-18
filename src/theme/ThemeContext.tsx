import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { colors, type ThemeColors } from './colors';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: true;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Forge is dark-only. No light palette, no system scheme, no toggle.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      colors,
      isDark: true as const,
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
