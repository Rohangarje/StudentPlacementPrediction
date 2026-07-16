/**
 * useTheme Hook (src/hooks/useTheme.js)
 *
 * Manages dark/light mode toggle.
 * Persists preference to localStorage.
 * Applies [data-theme] attribute to <html> to drive CSS custom properties.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'spp-theme';
const DEFAULT_THEME = 'dark';

/**
 * Custom hook for theme management.
 * @returns {{ theme: string, toggleTheme: Function, isDark: boolean }}
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  // Apply theme to <html> element and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* storage unavailable */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
