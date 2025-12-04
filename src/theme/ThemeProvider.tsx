// src/theme/ThemeProvider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import {
    defaultTheme,
    defaultThemeName,
    themes,
    type SerenoteTheme,
    type ThemeName,
} from './theme';

type ThemeContextValue = {
  themeName: ThemeName;
  theme: SerenoteTheme;
  setThemeName: (name: ThemeName) => void;
  loading: boolean;
};

export const ThemeContext =
  createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = '@serenote_theme_name';

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
}) => {
  const [themeName, setThemeNameState] =
    useState<ThemeName>(defaultThemeName);
  const [theme, setTheme] =
    useState<SerenoteTheme>(defaultTheme);
  const [loading, setLoading] = useState(true);

  // 起動時に AsyncStorage からテーマ名を読み込む
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;

        if (stored && stored in themes) {
          const name = stored as ThemeName;
          setThemeNameState(name);
          setTheme(themes[name]);
        }
      } catch (e) {
        console.warn('Failed to load theme from storage', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // テーマ変更時：state更新＋AsyncStorage保存
  const handleSetThemeName = useCallback(
    (name: ThemeName) => {
      setThemeNameState(name);
      setTheme(themes[name]);
      AsyncStorage.setItem(STORAGE_KEY, name).catch(e => {
        console.warn('Failed to save theme to storage', e);
      });
    },
    []
  );

  const value: ThemeContextValue = {
    themeName,
    theme,
    setThemeName: handleSetThemeName,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};