// src/theme/useTheme.ts
import { useContext } from 'react';
// ⬇️ ここを小文字にそろえる
import { ThemeContext } from './ThemeProvider';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}