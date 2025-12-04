// hooks/useUserSettings.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type UserSettings = {
  nickname: string | null;
};

const STORAGE_KEY = 'SERENOTE_USER_SETTINGS_V1';

const defaultSettings: UserSettings = {
  nickname: null,
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // 初回ロード
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;

        if (!json) {
          setSettings(defaultSettings);
        } else {
          try {
            const parsed = JSON.parse(json) as Partial<UserSettings>;
            setSettings({
              nickname:
                typeof parsed.nickname === 'string'
                  ? parsed.nickname
                  : null,
            });
          } catch (e) {
            console.warn('Failed to parse user settings, resetting.', e);
            setSettings(defaultSettings);
          }
        }
      } catch (e) {
        console.warn('Failed to load user settings', e);
        setSettings(defaultSettings);
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 保存関数（まとめて上書き）
  const saveSettings = useCallback(async (next: UserSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save user settings', e);
    }
  }, []);

  // 一部だけ更新したいとき用
  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      const next: UserSettings = {
        ...settings,
        ...partial,
      };
      await saveSettings(next);
    },
    [settings, saveSettings]
  );

  // ニックネーム専用のショートカット
  const updateNickname = useCallback(
    async (nickname: string) => {
      await updateSettings({ nickname: nickname.trim() || null });
    },
    [updateSettings]
  );

  return {
    loaded,
    settings,
    nickname: settings.nickname,
    updateNickname,
    updateSettings,
  };
}